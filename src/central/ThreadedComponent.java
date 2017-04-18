package central;

import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

import org.json.JSONObject;

/**
 * Base class for components. The constructor starts a thread that handles
 * the incoming messages.
 * 
 * @author Stefan Fixl
 */
public abstract class ThreadedComponent
{
	private final MessageQueue messageQueue;
	private volatile Central central;
	private volatile boolean running = false;
	private final ConcurrentHashMap<Long, Consumer<JSONObject>> answerCallbacks;

	final Component componentType;

	/**
	 * Constructor - starts a thread and initializes the message queue.
	 * 
	 * @param component
	 * @param central
	 */
	public ThreadedComponent(final Component component,
			final Central central)
	{
		this.componentType = component;
		this.central = central;
		this.messageQueue = new MessageQueue();
		this.answerCallbacks = new ConcurrentHashMap<>();

		Thread t = new Thread(componentType.toString())
		{
			public void run()
			{
				running = true;
				while (running)
				{
					try
					{
						// get next message (blocking)
						Message msg = messageQueue.getNext();
						// check if message is answer to a previously sent
						// one
						Consumer<JSONObject> consumer = answerCallbacks
								.get(msg.answerTo);
						if (consumer != null)
						{
							answerCallbacks.remove(msg.answerTo);
							consumer.accept(new JSONObject(msg.message));
						}
						else
						{
							JSONObject answer = onMessage(msg.sender,
									new JSONObject(msg.message));
							// if answer is null, return empty answer ({})
							if (answer == null)
							{
								answer = new JSONObject();
							}
							// return answer message
							central.newMessage(
									new Message(componentType, msg.sender,
											answer.toString(), msg.id));
						}
					}
					catch (Exception e)
					{
						ExceptionHandler.showErrorDialog(e);
					}
				}
			}
		};
		t.start();
	}

	/**
	 * Only used when the Central class is instantiated
	 * 
	 * @param Central
	 *            instance
	 */
	void setCentral(Central central)
	{
		this.central = central;
	}

	/**
	 * Adds a message to the message queue.
	 * 
	 * @param msg
	 *            Message to add
	 * @throws InterruptedException
	 */
	void addMessage(Message msg) throws InterruptedException
	{
		messageQueue.add(msg);
	}

	/**
	 * Stops the thread. If overridden, call it using the super operator.
	 */
	public void stop()
	{
		running = false;
	}

	/**
	 * Event handler that has to be implemented by the deriving class.
	 * 
	 * @param sender
	 *            The component the message comes from
	 * @param msg
	 *            JSONObject containing the message
	 * @return the answer to the message (can be null)
	 * @throws Exception
	 */
	protected abstract JSONObject onMessage(Component sender,
			JSONObject msg) throws Exception;

	/**
	 * Sends a message to (an) other component(s). It is safe to use the
	 * JSONObject message later.
	 * 
	 * @param recipient
	 * @param msg
	 * @throws InterruptedException
	 */
	protected void sendMessage(Component recipient, JSONObject msg)
			throws InterruptedException
	{
		sendMessage(recipient, msg, null);
	}

	/**
	 * Sends a request message to an other component It is safe to use the
	 * JSONObject later. Messages to Component.ANY are NOT allowed
	 * 
	 * @param recipient
	 *            Component
	 * @param msg
	 *            JSONObject containing the message
	 * @param onAnswer
	 *            Callback function that will be called instead of
	 *            onMessage
	 * @throws InterruptedException
	 * @throws Exception
	 */
	protected void sendMessage(Component recipient, JSONObject msg,
			Consumer<JSONObject> onAnswer) throws InterruptedException
	{
		Message message = new Message(componentType, recipient,
				msg.toString(), 0);
		central.newMessage(message);
		if (recipient == Component.ANY && onAnswer != null)
		{
			ExceptionHandler.showErrorDialog(new Exception(
					"Messages with multiple recipients and answer callbacks are not allowed!"));
			onAnswer = null;
		}
		if (onAnswer != null)
		{
			this.answerCallbacks.put(message.id, onAnswer);
		}
	}
}