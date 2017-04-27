package utils;

import java.util.function.Consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class JSLogger
{
	public static final String MESSAGE = "msg";
	public static final String LEVEL = "level";
	
	private static final Logger logger = LoggerFactory
			.getLogger(JSLogger.class);

	private JSLogger()
	{

	}

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

	private static void log(Consumer<String> consumer, String message)
	{
		consumer.accept(message);
	}
}
