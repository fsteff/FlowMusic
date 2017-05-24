package utils;

import java.util.function.Consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This class is used to log any messages from the JavaScript client. The
 * only reason this class exists is that the log message contains the name
 * of this class, so it is easier to identify such logs.
 * 
 * @author Michael Ratzenböck
 */
public class JSLogger
{
	/**
	 * The JSON-Object key of the message.
	 */
	public static final String MESSAGE = "msg";
	/**
	 * The JSON-Object key of the debug level.
	 */
	public static final String LEVEL = "level";

	private static final Logger logger = LoggerFactory
			.getLogger(JSLogger.class);

	private JSLogger()
	{

	}

	/**
	 * Logs the given message with the given level.
	 * 
	 * @param level
	 *            The level of the log.
	 * @param msg
	 *            The message of the log.
	 */
	public static void log(String level, String msg)
	{
		switch (level)
		{
		case "ERROR":
			log(logger::error, msg);
			break;

		case "WARN":
			log(logger::warn, msg);
			break;

		case "INFO":
			log(logger::info, msg);
			break;

		case "DEBUG":
			log(logger::debug, msg);
			break;

		case "TRACE":
			log(logger::trace, msg);
			break;
		}
	}

	/**
	 * Uses the consumer to log the message.
	 * 
	 * @param consumer
	 *            The logging method
	 * @param message
	 *            the logging message
	 */
	private static void log(Consumer<String> consumer, String message)
	{
		consumer.accept(message);
	}
}
