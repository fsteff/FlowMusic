package webserver;

import java.io.*;
import java.net.URL;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.function.Consumer;

import central.ExceptionHandler;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import central.Central;
import central.Component;
import central.ThreadedComponent;

import javax.swing.*;

/**
 * GUI Component
 * This is the message queue connection between the browser and the backend.
 */
public class Gui extends ThreadedComponent
{
	public static final String SEND_TO = "sendTo";
	private static volatile long browserMsgId = 10000001;
	
	private static final Logger logger = LoggerFactory
			.getLogger(Gui.class);

    /**
     * This read modified by the Webserver/Handler - /inmsg waits for messages put into the queue
     */
	protected final LinkedBlockingDeque<JSONObject> toBrowserQueue = new LinkedBlockingDeque<>();
	
	public Gui(Central central)
	{
		super(Component.GUI, central);
	}

    /**
     * onMessage Handler (all messages are forwarded to the browser)
     * @param sender
     *            The component the message comes from
     * @param msg
     *            JSONObject containing the message
     * @return
     * @throws Exception
     */
	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg)
			throws Exception
	{
		
		JSONObject obj = new JSONObject();
		obj.put("msg", msg);
		obj.put("id", browserMsgId++);
		obj.put("answerTo", 0);
		obj.put("recipient", "GUI");
		obj.put("sender", sender.toString());

		// send the message to the browser ( /inmsg)
		toBrowserQueue.putLast(obj);

        // TODO implement Callback for answer from browser (not needed atm)
		return null;
	}

    /**
     * Called by the Webserver Component (in MyHandler.java) when a message from the browser to the
     * message queue of the backend arrives at /msg.
     * @param msg JSONObject containing the message
     * @throws JSONException
     * @throws InterruptedException
     */
	public void messageIncoming(JSONObject msg) throws JSONException, InterruptedException
	{
        final int browserId = msg.getInt("id");
        final String recipient = msg.getString("recipient").toUpperCase();

	    // if the message recipient is the GUI component itself:
	    if(recipient.equalsIgnoreCase("GUI")
                &&msg.optJSONObject("msg") != null
                && msg.getJSONObject("msg").optString("command") != null){
	        // check if the messages contains the required fields
	        String cmd = msg.getJSONObject("msg").getString("command");
	        JSONObject message = msg.getJSONObject("msg");
	        // browse directory command (music directory settings)
            if(cmd.equalsIgnoreCase("browse directory")){
                chooseFile(msg);
                return;

            // load a website
            }else if(cmd.equalsIgnoreCase("get url")
                    && message.optString("url") != null
                    && msg.opt("id") != null) {
                getURL(message.getString("url"), msg.getInt("id"));
                return;
            }
        }

        // else send it to its recipient
		Consumer<JSONObject> answer = jsonMsg ->
		{
			JSONObject obj = new JSONObject();
			obj.put("msg", jsonMsg);
			obj.put("id", browserMsgId++);
			obj.put("answerTo", browserId);
			obj.put("recipient", "GUI");
			obj.put("sender", recipient);
			
			try
			{
				toBrowserQueue.putLast(obj);
			}
			catch (InterruptedException e)
			{
				logger.error("",e);
			}
		};
		sendMessage(Component.valueOf(recipient), msg.getJSONObject("msg"), answer);
	}

    /**
     * Creates a JFileChooser and modifies the config
     * @param msg JSONObject message from the browser
     * @throws InterruptedException
     */
	private void chooseFile(JSONObject msg) throws InterruptedException{
	    // array index of the directory to modify
        final int num = msg.getJSONObject("msg").optInt("number");
        // first get the config from the central
        sendMessage(Component.CENTRAL, Central.Messages.getConfig(), answer -> {
            JSONObject cfg = answer.getJSONObject(Central.Messages.CONFIG);
            JSONArray paths = cfg.optJSONArray(Central.Config.MUSIC_DIRS);
            if(paths == null){
                paths = new JSONArray();
                cfg.put(Central.Config.MUSIC_DIRS, paths);
            }
            JFileChooser chooser = null;
            if(num >= 0){
                File path = new File(paths.getString(num));
                if(path.exists()){
                    chooser = new JFileChooser(path);
                }
            }
            if(chooser == null){
                chooser = new JFileChooser();
            }
            JFrame frame = new JFrame();
            frame.setVisible(true);
            frame.setExtendedState(JFrame.ICONIFIED);
            frame.setExtendedState(JFrame.NORMAL);

            chooser.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);

            int result = chooser.showOpenDialog(frame);//(new JPanel(), null);
            if (result == JFileChooser.APPROVE_OPTION) {
                File selected = chooser.getSelectedFile();
                if(num >= 0){
                    paths.remove(num);
                }
                paths.put(selected.getAbsolutePath());
                try {
                    // update the config
                    sendMessage(Component.CENTRAL, Central.Messages.setConfig(cfg), aw -> {
                        System.out.println("config changed");
                    });
                }catch(Exception e){
                    ExceptionHandler.showErrorDialog(e);
                    logger.error("", e);
                }
            }
            frame.setVisible(false);
        });
    }

    /**
     * Loads an HTML page and sends it to the browser.
     * @param urlString url of the page (needs http:\\ or https:\\ prefix)
     * @param msgId browser side message id for identifying the answer
     */
    private void getURL(String urlString, int msgId){
        URL url;
        InputStream is = null;
        BufferedReader br;
        String line;
        String html = "";
        JSONObject answer = new JSONObject();

        try {
            url = new URL(urlString);
            is = url.openStream();  // throws an IOException
            br = new BufferedReader(new InputStreamReader(is));

            while ((line = br.readLine()) != null) {
                html += line + "\n";
            }

            // send the retrieved page to the browser
            JSONObject json = new JSONObject();
            json.put("answer", html);
            answer.put("msg", json);
            answer.put("id", browserMsgId++);
            answer.put("answerTo", msgId);
            answer.put("recipient", "GUI");
            answer.put("sender", "GUI");


        } catch (Exception e) {
            logger.info("HTML fetch error", e);

            // answer with an error message
            JSONObject json = new JSONObject();
            json.put("answer", "invalid url");
            answer.put("msg", json);
            answer.put("id", browserMsgId++);
            answer.put("answerTo", msgId);
            answer.put("recipient", "GUI");
            answer.put("sender", "GUI");
        } finally {
            try {
                if (is != null) is.close();
            } catch (IOException ioe) {}
        }

        try{
            toBrowserQueue.putLast(answer);
        }catch (InterruptedException e){
            logger.error("", e);
            ExceptionHandler.showErrorDialog(e);
        }
    }
}
