package central;

/**
 * Enumeration for recipient/sender handling in the message queue.
 * @author Stefan Fixl
 */
public enum Component{
	ANY,
	DATABASE,
	CRAWLER,
	WEBSERVER,
	CENTRAL
};
