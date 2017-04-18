package central;

/**
 * Message in the message queue
 * @author Stefan Fixl
 */
class Message{
	final Component sender;
	final Component recipient;
	final String message;
	final long answerTo;
	final long id;
	
	private static volatile long idCounter = 1;
	
	Message(final Component sender, final Component recipient, final String message, final long answerTo){
		this.sender = sender;
		this.recipient = recipient;
		this.message = message;
		this.answerTo = answerTo;
		this.id = idCounter++;
	}
}
