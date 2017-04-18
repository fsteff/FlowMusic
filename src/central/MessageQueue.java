package central;

import java.util.concurrent.LinkedBlockingDeque;

/**
 * Message Queue (threadsafe)
 * @author Stefan Fixl
 */
class MessageQueue {
	
	private LinkedBlockingDeque<Message> queue = new LinkedBlockingDeque<Message>();
	
	/**
	 * Retrieves the first element in the message queue and blocks the thread until one is available
	 * @return
	 * @throws InterruptedException
	 */
	Message getNext() throws InterruptedException{
		return queue.takeFirst();
	}
	
	/**
	 * Puts an element to the end of the queue and blocks the tread until the operation is possible.
	 * @param msg
	 * @throws InterruptedException
	 */
	void add(Message msg) throws InterruptedException{
		queue.putLast(msg);
	}
	
	/**
	 * @return if message queue is non-empty
	 */
	boolean hasNext(){
		return ! queue.isEmpty();
	}
	
	
}
