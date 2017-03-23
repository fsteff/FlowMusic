package Central;

import org.json.JSONObject;

public abstract class ThreadedComponent {
	private final MessageQueue messageQueue;
	private final Central central;	
	private boolean running = false;
	
	final Component componentType;
	
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
	
	void addMessage(Message msg){
		messageQueue.add(msg);
	}
	
	void stop(){
		running = false;
	}
	
	
	
	public abstract void onMessage(Component sender, JSONObject msg) throws Exception;
	
	public void sendMessage(Component recipient, JSONObject msg){
		central.newMessage(new Message(componentType, recipient, msg.toString()));
	}
}
