package webserver;

import java.util.concurrent.LinkedBlockingDeque;
import java.util.function.Consumer;

import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import central.Central;
import central.Component;
import central.ThreadedComponent;

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
}
