package central;

import java.io.IOException;
import java.io.InputStream;
import java.util.Vector;

import org.h2.store.fs.FileUtils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.joran.JoranConfigurator;
import ch.qos.logback.core.joran.spi.JoranException;
import crawler.Crawler;
import database.Database;
import webserver.Webserver;


/**
 * Main Class that controls all the other components.
 * @author Stefan Fixl
 *
 */
public class Central extends ThreadedComponent{
	static
	{
		LoggerContext loggerContext = (LoggerContext) LoggerFactory.getILoggerFactory();
		loggerContext.reset();
		JoranConfigurator configurator = new JoranConfigurator();
		try
		{
			InputStream configStream = FileUtils.newInputStream("res/Logger_Properties.xml");
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
	private static final Logger logger = LoggerFactory.getLogger(Central.class);
	
	private Vector<ThreadedComponent> components;
	
	Central(){
		super(Component.CENTRAL, null);
		this.components = new Vector<ThreadedComponent>();
		this.setCentral(this);
		this.components.addElement(this);
		
	}
	
	void newMessage(Message msg) throws InterruptedException{
		for(ThreadedComponent component : components){
			if(msg.recipient == component.componentType || msg.recipient == Component.ANY){
				component.addMessage(msg);
			}
		}
	}
	
	void addComponent(ThreadedComponent component){
		this.components.addElement(component);
	}
	
	// TODO: implement good system for component loading
	
	public static void main(String[] args){
		Central central = new Central();
		central.addComponent(new Webserver(central));
		central.addComponent(new Crawler(central));
		central.addComponent(new Database(central));
		
		JSONObject json = new JSONObject();
		json.put("command", "start");
		
		try {
			central.sendMessage(Component.WEBSERVER, json, msg -> System.out.println("Webserver started: "+msg));
			central.sendMessage(Component.CRAWLER, json, msg -> System.out.println("Crawler started: "+msg));
			central.sendMessage(Component.DATABASE, json, msg -> System.out.println("Database started: "+msg));
		} catch (InterruptedException e) {
			ExceptionHandler.showErrorDialog(e);
		}
		
	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg) throws Exception {
		System.out.println(msg);
		return null;
	}
}
