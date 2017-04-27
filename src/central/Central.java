package central;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.util.Vector;
import java.util.function.Consumer;

import org.h2.store.fs.FileUtils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.joran.JoranConfigurator;
import ch.qos.logback.core.joran.spi.JoranException;
import crawler.Crawler;
import database.Database;
import webserver.Gui;
import webserver.Webserver;

/**
 * Main Class that controls all the other components.
 * 
 * @author Stefan Fixl
 */
public class Central extends ThreadedComponent
{
	static
	{
		LoggerContext loggerContext = (LoggerContext) LoggerFactory
				.getILoggerFactory();
		loggerContext.reset();
		JoranConfigurator configurator = new JoranConfigurator();
		try
		{
			InputStream configStream = FileUtils
					.newInputStream("res/Logger_Properties.xml");
			configurator.setContext(loggerContext);
			configurator.doConfigure(configStream);
			configStream.close();
		}
		catch (IOException | JoranException e)
		{
			System.err.println("Could not load Logger config...");
			System.exit(-1);
		}
	}

	@SuppressWarnings("unused")
	private static final Logger logger = LoggerFactory
			.getLogger(Central.class);

	private Vector<ThreadedComponent> components;
	private JSONObject config;
	private File configFile = null;

	Central(File configFile)
	{
		super(Component.CENTRAL, null);
		this.configFile = configFile;
		this.components = new Vector<ThreadedComponent>();
		this.setCentral(this);
		this.components.addElement(this);

		if (configFile.isDirectory())
		{
			ExceptionHandler.showErrorDialog("Error",
					"Config file is a directory!");
			configFile = new File("./config.json");
		}

		if (!configFile.exists())
		{
			this.createDefaultConfig();
		}
		else
		{
			try (BufferedReader in = new BufferedReader(
					new FileReader(configFile));)
			{
				String json = "";
				String line = null;
				while ((line = in.readLine()) != null)
				{
					json += line;
				}
				in.close();

				if (json.length() > 0)
				{
					this.config = new JSONObject(json);
				}
			}
			catch (Exception e)
			{
				ExceptionHandler.showErrorDialog(e);

				this.createDefaultConfig();
			}
		}
	}

	void createDefaultConfig()
	{
		this.config = new JSONObject();
		try
		{
			String str = this.config.toString(2);
			FileWriter writer = new FileWriter(this.configFile);
			writer.write(str);
			writer.close();
		}
		catch (IOException e)
		{
			ExceptionHandler.showErrorDialog(e);
		}
	}

	void configChanged() throws InterruptedException
	{
		try
		{
			String str = this.config.toString(2);
			FileWriter writer = new FileWriter(this.configFile);
			writer.write(str);
			writer.close();
		}
		catch (IOException e)
		{
			ExceptionHandler.showErrorDialog(e);
		}

		JSONObject json = new JSONObject();
		json.put("command", "config changed");
		json.put("config", this.config);
		sendMessage(Component.ANY, json);
	}

	void newMessage(Message msg) throws InterruptedException
	{
		for (ThreadedComponent component : components)
		{
			if (msg.recipient == component.componentType
					|| msg.recipient == Component.ANY)
			{
				component.addMessage(msg);
			}
		}
	}

	void addComponent(ThreadedComponent component)
	{
		this.components.addElement(component);
	}

	// TODO: implement good system for component loading
	/**
	 * @param args
	 */
	public static void main(String[] args)
	{
		File configPath = null;
		if (args.length > 0 && args[0].length() > 0)
		{
			configPath = new File(args[0]);
		}
		else
		{
			configPath = new File(System.getProperty("user.home")
					+ "/.FlowMusic/config.json");
		}
		Central central = new Central(configPath);
		Webserver webserver = new Webserver(central);
		Gui gui = new Gui(central, webserver.getHandler());
		webserver.setGui(gui);

		central.addComponent(webserver);
		central.addComponent(new Crawler(central));
		central.addComponent(new Database(central));
		central.addComponent(gui);

		JSONObject json = new JSONObject();
		json.put("command", "start");

		try
		{
			central.sendMessage(Component.WEBSERVER, json,
					msg -> System.out
							.println("Webserver started: " + msg));
			central.sendMessage(Component.CRAWLER, json,
					msg -> System.out.println("Crawler started: " + msg));
			central.sendMessage(Component.DATABASE, json,
					msg -> System.out.println("Database started: " + msg));
			central.sendMessage(Component.GUI, json,
					msg -> System.out.println("Database started: " + msg));
		}
		catch (InterruptedException e)
		{
			ExceptionHandler.showErrorDialog(e);
		}

	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg)
			throws Exception
	{
		switch (msg.getString("command"))
		{
		case "get config":
			JSONObject json = new JSONObject();
			json.put("config", this.config);
			return json;

		case "set config":
			JSONObject newConfig = msg.optJSONObject("config");
			if (newConfig == null)
			{
				throw new Exception(
						"Invalid message does not contain 'config': "
								+ msg.toString());
			}
			else
			{
				this.config = newConfig;
				this.configChanged();
			}

			JSONObject answer = new JSONObject();
			answer.put("answer", "done");
			return answer;
		}
		return null;
	}
}
