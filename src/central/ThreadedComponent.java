package central;

import org.json.JSONObject;

/**
 * Base class for components.
 * The constructor starts a thread that handles the incoming messages.
 * @author Stefan Fixl
 */
public abstract class ThreadedComponent {
	private final MessageQueue messageQueue;
	private final Central central;	
	private boolean running = false;
	
	final Component componentType;
	
	/**
	 * Constructor - starts a thread and initializes the message queue.
	 * @param component
	 * @param central
	 */
	public ThreadedComponent(Component component, Central central){
		this.componentType = component;
		this.central = central;
		this.messageQueue = new MessageQueue();
		
		Thread t = new Thread(){
			public void run(){
				running = true;
				while(running){
					while(messageQueue.hasNext()){
						Message msg = messageQueue.getNext();
						try {
							onMessage(msg.sender, new JSONObject(msg.message));
						} catch (Exception e) {
							ExceptionHandler.onException(e);
						}
					}
					try {
						Thread.sleep(0);
					} catch (InterruptedException e) {
						ExceptionHandler.onException(e);
					}
				}
			}
		};
		
		t.start();
	}
	/**
	 * Adds a message to the message queue.
	 * @param msg Message to add
	 */
	void addMessage(Message msg){
		messageQueue.add(msg);
	}
	
	/**
	 * Stops the thread.
	 * If overridden, call it using the super operator.
	 */
	public void stop(){
		running = false;
	}
	
	
	/**
	 * Event handler that has to be implemented by the deriving class.
	 * @param sender The component the message comes from
	 * @param msg JSONObject containing the message
	 * @throws Exception
	 */
	public abstract void onMessage(Component sender, JSONObject msg) throws Exception;
	
	
	/**
	 * Sends a message to (an) other component(s).
	 * It is safe to use the JSONObject message later.
	 * @param recipient 
	 * @param msg 
	 */
	public void sendMessage(Component recipient, JSONObject msg){
		central.newMessage(new Message(componentType, recipient, msg.toString()));
	}
}
