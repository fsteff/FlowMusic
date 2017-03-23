package Central;

import java.util.concurrent.ConcurrentLinkedQueue;

public class MessageQueue {
	
	private ConcurrentLinkedQueue<Message> queue = new ConcurrentLinkedQueue<Message>();
	
	Message getNext(){
		return queue.remove();
	}
	
	void add(Message msg){
		queue.add(msg);
	}
	
	boolean hasNext(){
		return ! queue.isEmpty();
	}
	
	
}
