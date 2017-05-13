package webserver;

import java.io.File;
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
import javax.swing.filechooser.FileFilter;

public class Gui extends ThreadedComponent
{
	public static final String SEND_TO = "sendTo";
	private static volatile long browserMsgId = 10000001;
	
	private static final Logger logger = LoggerFactory
			.getLogger(Gui.class);

	protected final LinkedBlockingDeque<JSONObject> toBrowserQueue = new LinkedBlockingDeque<>();
	
	public Gui(Central central)
	{
		super(Component.GUI, central);
	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg)
			throws Exception
	{
		// TODO implement Callback for answer from browser.
		
		JSONObject obj = new JSONObject();
		obj.put("msg", msg);
		obj.put("id", browserMsgId++);
		obj.put("answerTo", 0);
		obj.put("recipient", "GUI");
		obj.put("sender", sender.toString());
		
		toBrowserQueue.putLast(obj);

		return null;
	}

	public void messageIncoming(JSONObject msg) throws JSONException, InterruptedException
	{
	    // Manage File chooser dialogu
	    if(msg.optJSONObject("msg") != null
                && msg.getJSONObject("msg").optString("command") != null
                && msg.getJSONObject("msg").getString("command").equalsIgnoreCase("browse directory")){
            chooseFile(msg);
            return;
        }
		final int browserId = msg.getInt("id");
		final String recipient = msg.getString("recipient").toUpperCase();
		
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

	private void chooseFile(JSONObject msg) throws InterruptedException{
        final int num = msg.getJSONObject("msg").optInt("number");
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
}
