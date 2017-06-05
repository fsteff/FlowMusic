package central;

import java.awt.Desktop;
import java.awt.Desktop.Action;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Handler;

import org.h2.store.fs.FileUtils;
import org.json.JSONArray;
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

import javax.swing.*;

/**
 * Main Class that controls all the other components.
 * 
 * @author Stefan Fixl
 */
public class Central extends ThreadedComponent
{
    /**
     * Constants for the communication with this component.
     */
	public static class Messages
	{
		public final static String GET_CONFIG = "get config";
		public final static String SET_CONFIG = "set config";
		public final static String COMMAND = "command";
		public final static String CONFIG = "config";
		public final static String ANSWER = "answer";
		public final static String CONFIG_CHANGED = "config changed";

        /**
         * Generates a "get config" message
         * @return JSONObject message to send to the Central
         */
		public static JSONObject getConfig()
		{
			return new JSONObject(
					"{\"" + COMMAND + "\":\"" + GET_CONFIG + "\"}");
		}

        /**
         * Generates a "set config" message
         * @param cfg new config
         * @return JSONObject message to send to the Central
         */
		public static JSONObject setConfig(JSONObject cfg)
		{
			JSONObject obj = new JSONObject();
			obj.put(COMMAND, SET_CONFIG);
			obj.put(CONFIG, cfg);
			return obj;
		}
	}

    /**
     * Constants for convenience use
     */
	public static class Config
	{
		public final static String DB_LOCATION = "DBLocation";
		public final static String MUSIC_DIRS = "MusicDirectories";
	}

	// load the logger:
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

	private static final Logger logger = LoggerFactory
			.getLogger(Central.class);

	private ConcurrentHashMap<Component, ThreadedComponent> components;
	private JSONObject config;
	private File configFile = null;

    /**
     * Constructor
     * Loads the config file or creates a new one if it does not exist
     * @param configFile path to the config file
     */
	Central(File configFile)
	{
		super(Component.CENTRAL, null);
		this._setCentral(this);
		this.configFile = configFile;
		this.components = new ConcurrentHashMap<>();
		this.components.put(Component.CENTRAL, this);

		if (configFile.isDirectory())
		{
			ExceptionHandler.showErrorDialog("Error",
					"Config file is a directory!");
			logger.error("Config file is a directory");
			configFile = new File("./config.json");
		}

		if (!configFile.exists())
		{
			checkAndFixConfig();
			writeConfig();
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
				logger.error("", e);

			}
			finally
			{
				checkAndFixConfig();
				writeConfig();
			}
		}
	}

    /**
     * Checks if the config is valid and fix it if that is not the case
     */
	void checkAndFixConfig()
	{
		if (this.config == null)
		{
			this.config = new JSONObject();
		}
		if (this.config.opt(Config.DB_LOCATION) == null)
		{
			this.config.put(Config.DB_LOCATION,
					this.configFile.getParent() + File.separator + "data");
		}

		JSONArray dirs = this.config.optJSONArray(Config.MUSIC_DIRS);
		ArrayList<String> entries = new ArrayList<>();
		// check double entries
		if (dirs != null && dirs.length() > 0)
		{
			for (Object obj : dirs)
			{
				if (obj instanceof String)
				{
					String str = (String) obj;
					boolean found = false;
					for (String s : entries)
					{
						if (s.equals(str))
						{
							found = true;
						}
					}
					if (!found)
					{
						entries.add((String) obj);
					}
				}
			}
		}
		dirs = new JSONArray();
		for (String s : entries)
		{
			dirs.put(s);
		}
		this.config.put(Config.MUSIC_DIRS, dirs);
	}

    /**
     * Writes the config to the file
     */
	void writeConfig()
	{
		try
		{
			String str = this.config.toString(2);
			FileWriter writer = new FileWriter(this.configFile);
			writer.write(str);
			writer.close();
			logger.info("Config successfully written to file");
		}
		catch (IOException e)
		{
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		}
	}

    /**
     * Called when the config was chenged.
     * Writes the new config to the file and sends a message to all components.
     * @throws InterruptedException
     */
	void configChanged() throws InterruptedException
	{
		checkAndFixConfig();
		writeConfig();

		JSONObject json = new JSONObject();
		json.put(Messages.COMMAND, Messages.CONFIG_CHANGED);
		json.put(Messages.CONFIG, this.config);
		sendMessage(Component.ANY, json, m ->
		{});
	}

    /**
     * Called by ThreadedComponent in sendMessage.
     * This sends a message to its recipient(s)
     * @param msg Message to send
     * @throws InterruptedException
     */
	void newMessage(Message msg) throws InterruptedException
	{
		ThreadedComponent comp = components.get(msg.recipient);
		if (comp != null)
		{
			comp.addMessage(msg);
			int len = msg.message.length()-1;
			String logmsg = null;
			if(len > 1000){
			    logmsg = msg.message.substring(0, 1000) + "...";
            }else{
			    logmsg = msg.message;
            }
			logger.info("Message from " + msg.sender + " to "
					+ msg.recipient + ": " + logmsg);
		}
	}

    /**
     * Adds a component to the message queue
     * @param component
     */
	void addComponent(ThreadedComponent component)
	{
		this.components.put(component.componentType, component);
	}

	/**
     * Main entry point
     * If args.length == 0, the path is [UserHome]/.FlowMusic/config.json
	 * @param args argument[0] is the path to the config file (relative or absolute, can be null)
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
			File parentFolder = new File(System.getProperty("user.home")
					+ File.separator + ".FlowMusic");
			if (!parentFolder.exists())
			{
				parentFolder.mkdir();
			}
			configPath = new File(parentFolder.getPath() + File.separator
					+ "config.json");
		}

		// start it all up!
		Central central = new Central(configPath);
		Gui gui = new Gui(central);
		Webserver webserver = new Webserver(central, gui);
		central.addComponent(webserver);
		central.addComponent(gui);
		central.addComponent(new Crawler(central));
		central.addComponent(new Database(central,
				new File(central.config.getString("DBLocation"))
						.getAbsoluteFile()));

		JSONObject json = new JSONObject();
		json.put(Messages.COMMAND, "start");

		try
		{
			central.sendMessage(Component.WEBSERVER, json,
					msg -> logger.info("webserver started"));
			central.sendMessage(Component.DATABASE, json,
					msg -> logger.info("database started"));
			central.sendMessage(Component.GUI, json,
					msg -> logger.info("gui started"));

			startBrowser();

			// start crawler 5s later to make the startup faster
			Thread.sleep(5000);
            central.sendMessage(Component.CRAWLER, json,
                    msg -> logger.info("crawler started"));
		}
		catch (InterruptedException e)
		{
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		}


	}

	/**
	 * Starts the Chromium Browser and terminates the application if the
	 * browser gets closed.
     * For this to work there has to be a chromium browser in ./chromium/chrome.exe
	 */
	private static void startBrowser()
	{
		Thread t = new Thread(() ->
		{
			final String chromiumParam = "--app=\"http:\\\\localhost:8080\"";
			final File f = new File("chromium/chrome.exe");

			// only can start chrome.exe if os is windows and if the file exists
			if (! System.getProperty("os.name").toLowerCase().contains("windows")
                    || ! Files.exists(Paths.get(f.getAbsolutePath())))
			{
                startChrome(chromiumParam);
			}
			else
			{
				ProcessBuilder pb = new ProcessBuilder("cmd", "/c",
						f.getAbsolutePath(), chromiumParam,
						"--start-maximized");

				try
				{
					Process p = pb.start();
					p.waitFor();
					logger.info("Exit value: " + p.exitValue());
					System.exit(p.exitValue());
				}
				catch (Exception e)
				{
					logger.error("", e);
				}
			}
		});

		t.start();
	}

    /**
     * Starts chrome with the given parameter
     * @param param program argument(s)
     */
	private static void startChrome(String param){
        try {
            if (System.getProperty("os.name").toLowerCase()
                    .contains("windows")) {
                Runtime.getRuntime().exec(new String[]{"cmd", "/c", "start chrome "+param});

            } else {
                // should work on POSIX systems that have chromium installed:
                Runtime.getRuntime().exec(new String[]{"chromium", param});
            }
        }catch(Exception e){
            logger.error("",e);

            JOptionPane.showMessageDialog(null, "Could not find chrome on this computer\n" +
                            "please install chrome or chromium!\n" +
                            "If you actually have installed it, open http:\\\\localhost:8080"
                    , "Chrome not found",
                    JOptionPane.ERROR_MESSAGE);
        }
    }

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg)
			throws Exception
	{
		String cmd = msg.optString(Messages.COMMAND);
		switch (cmd)
		{
		case Messages.GET_CONFIG:
			JSONObject json = new JSONObject();
			json.put(Messages.CONFIG, this.config);
			return json;

		case Messages.SET_CONFIG:
			JSONObject newConfig = msg.optJSONObject(Messages.CONFIG);
			if (newConfig == null)
			{
				logger.error(
						"'set config' - message does not contain 'config':"
								+ msg.toString());
				ExceptionHandler.showErrorDialog(new Exception(
						"Invalid message does not contain 'config': "
								+ msg.toString()));
			}
			else
			{
				this.config = newConfig;
				this.configChanged();
			}

			JSONObject answer = new JSONObject();
			answer.put(Messages.ANSWER, "done");
			return answer;
		default:
			if (cmd == null)
			{
				logger.error("Message does not have 'command' :"
						+ msg.toString());
			}
			else
			{
				logger.debug("Unhandled message command:" + cmd);
			}
			break;
		}
		return null;
	}
}
