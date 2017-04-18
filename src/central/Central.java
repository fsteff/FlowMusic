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
	
	private static final Logger logger = LoggerFactory.getLogger(Central.class);
	private Vector<ThreadedComponent> components;
	
	Central(){
		super(Component.CENTRAL, null);
		this.components = new Vector<ThreadedComponent>();
		this.setCentral(this);
		this.components.addElement(this);
		
	}
	
	void newMessage(Message msg){
		for(ThreadedComponent component : components){
			if(msg.recipient == component.componentType || msg.recipient == Component.ANY){
				component.addMessage(msg);
			}
		}
	}
	
	// TODO: implement good system for component loading
	
	public static void main(String[] args){
		Central central = new Central();
		central.components.addElement(new Webserver(central));
		JSONObject json = new JSONObject();
		json.put("command", "start");
		
		central.sendMessage(Component.WEBSERVER, json, msg -> System.out.println("Webserver started: "+msg.getString("answer")));
	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg) throws Exception {
		System.out.println(msg);
		return null;
	}
}
