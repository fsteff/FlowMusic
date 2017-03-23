package central;

/**
 * Message in the message queue
 * @author Stefan Fixl
 */
class Message{
	final Component sender;
	final Component recipient;
	final String message;
	
	Message(Component sender, Component recipient, String message){
		this.sender = sender;
		this.recipient = recipient;
		this.message = message;
	}
}
