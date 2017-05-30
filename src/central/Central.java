package central;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;

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

/**
 * Main Class that controls all the other components.
 * 
 * @author Stefan Fixl
 */
public class Central extends ThreadedComponent
{
    public static class Messages{
        public final static String GET_CONFIG = "get config";
        public final static String SET_CONFIG = "set config";
        public final static String COMMAND = "command";
        public final static String CONFIG = "config";
        public final static String ANSWER = "answer";
        public static JSONObject getConfig(){
            return new JSONObject("{\""+COMMAND+"\":\""+GET_CONFIG+"\"}");
        }
        public static JSONObject setConfig(JSONObject cfg){
            JSONObject obj = new JSONObject();
            obj.put(COMMAND, SET_CONFIG);
            obj.put(CONFIG, cfg);
            return obj;
        }
    }

    public static class Config{
        public final static String DB_LOCATION = "DBLocation";
        public final static String MUSIC_DIRS = "MusicDirectories";
    }

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

	private ConcurrentHashMap<Component, ThreadedComponent> components;
	private JSONObject config;
	private File configFile = null;

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

			}finally {
                checkAndFixConfig();
                writeConfig();
            }
        }
	}

	void checkAndFixConfig(){
	    if(this.config == null){
	        this.config = new JSONObject();
        }
        if(this.config.opt(Config.DB_LOCATION) == null){
            this.config.put(Config.DB_LOCATION, this.configFile.getParent() + File.separator + "data");
        }

        JSONArray dirs = this.config.optJSONArray(Config.MUSIC_DIRS);
        ArrayList<String> entries = new ArrayList<>();
        // check double entries
        if(dirs != null && dirs.length() > 0) {
            for (Object obj : dirs) {
                if (obj instanceof String) {
                    String str = (String) obj;
                    boolean found = false;
                    for(String s : entries){
                        if(s.equals(str)){
                            found = true;
                        }
                    }
                    if(!found) {
                        entries.add((String) obj);
                    }
                }
            }
        }
        dirs = new JSONArray();
        for(String s : entries){
            dirs.put(s);
        }
        this.config.put(Config.MUSIC_DIRS, dirs);
    }

    void writeConfig(){
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

	void configChanged() throws InterruptedException
	{
	    checkAndFixConfig();
		writeConfig();

		JSONObject json = new JSONObject();
		json.put(Messages.COMMAND, "config changed");
		json.put(Messages.CONFIG, this.config);
		sendMessage(Component.ANY, json, m -> {});
	}

	void newMessage(Message msg) throws InterruptedException
    {
        ThreadedComponent comp = components.get(msg.recipient);
        if(comp != null) {
            comp.addMessage(msg);
            logger.info("Message from " + msg.sender + " to " + msg.recipient + ": " + msg.message);
        }
	}

	void addComponent(ThreadedComponent component)
	{
	    this.components.put(component.componentType, component);
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
			File parentFolder = new File(System.getProperty("user.home") + File.separator + ".FlowMusic");
			if(! parentFolder.exists()){
				parentFolder.mkdir();
			}
			configPath = new File(parentFolder.getPath() + File.separator
					+ "config.json");
		}
		Central central = new Central(configPath);
		Gui gui = new Gui(central);
		Webserver webserver = new Webserver(central, gui);
		central.addComponent(webserver);
		central.addComponent(gui);
		central.addComponent(new Crawler(central));
		central.addComponent(new Database(central,
                new File(central.config.getString("DBLocation")).getAbsoluteFile()));
		

		JSONObject json = new JSONObject();
		json.put(Messages.COMMAND, "start");

		try
		{
			central.sendMessage(Component.WEBSERVER, json,
					msg -> logger.info("webserver started"));
			central.sendMessage(Component.CRAWLER, json,
					msg -> logger.info("crawler started"));
			central.sendMessage(Component.DATABASE, json,
					msg -> logger.info("database started"));
			central.sendMessage(Component.GUI, json,
					msg -> logger.info("gui started"));
		}
		catch (InterruptedException e)
		{
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		}
		startChrome();
	}
	
	/**
	 * Starts the Chromium Browser and terminates the application if the
	 * browser gets closed.
	 */
	private static void startChrome()
	{
		Thread t = new Thread(() ->
		{
			final String chromiumParam = "--app=\"http:\\\\localhost:8080\"";
			final File f = new File("chromium/chrome.exe");

			if (!Files.exists(Paths.get(f.getAbsolutePath())))
			{
				ExceptionHandler.showErrorDialog("Error", "Chromium not found...");
			}
			else
			{
				System.out.println(f.getAbsolutePath());
				ProcessBuilder pb = new ProcessBuilder("cmd", "/c",
						f.getAbsolutePath(), chromiumParam, "--start-maximized");

				try
				{
					Process p = pb.start();
					p.waitFor();
					System.out.println("Exit value: " + p.exitValue());
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
                logger.error("'set config' - message does not contain 'config':" + msg.toString());
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
		    if(cmd == null){
                logger.error("Message does not have 'command' :"+msg.toString());
            }else {
                logger.error("Unhandled message command:" + cmd);
            }
            break;
		}
		return null;
	}
}
