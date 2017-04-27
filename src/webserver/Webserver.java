package webserver;

import java.util.function.Consumer;

import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import central.Central;
import central.Component;
import central.ExceptionHandler;
import central.ThreadedComponent;

/**
 * Simple Jetty FileServer. This is a simple example of Jetty configured as
 * a FileServer.
 */
public class Webserver extends ThreadedComponent
{
	private static final Logger logger = LoggerFactory
			.getLogger(Webserver.class);
	private Server server;
	private Gui gui;
	private MyHandler handler;
	
	public Webserver(Central central)
	{
		super(Component.WEBSERVER, central);
	}

	public void start() throws Exception
	{
		// Create a basic Jetty server object that will listen on port
		// 8080. Note that if you set this to port 0
		// then a randomly available port will be assigned that you can
		// either look in the logs for the port,
		// or programmatically obtain it for use in test cases.
		server = new Server(8080);

		// Create the ResourceHandler. It is the object that will actually
		// handle the request for a given file. It is
		// a Jetty Handler object so it is suitable for chaining with other
		// handlers as you will see in other examples.
		ResourceHandler resource_handler = new ResourceHandler();

		// Configure the ResourceHandler. Setting the resource base
		// indicates where the files should be served out of.
		// In this example it is the current directory but it can be
		// configured to anything that the jvm has access to.
		resource_handler.setDirectoriesListed(true);
		resource_handler.setWelcomeFiles(new String[] { "index.html" });
		resource_handler.setResourceBase("./FlowMusicUI/");

		// Add the ResourceHandler to the server.
		HandlerList handlers = new HandlerList();
		handler = new MyHandler(this);
		handlers.setHandlers(
				new Handler[] { resource_handler, handler});
		server.setHandler(handlers);

		// Start things up! By using the server.join() the server thread
		// will join with the current thread.
		// See
		// "http://docs.oracle.com/javase/1.5.0/docs/api/java/lang/Thread.html#join()"
		// for more details.
		server.start();
		// server.join();
	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg)
			throws Exception
	{
		if (sender == Component.WEBSERVER)
		{
			String command = msg.getString("command");
			if (command.equalsIgnoreCase("start"))
			{
				start();
				return new JSONObject("{\"answer\":\"ready\"}");
			}
			if (command.equalsIgnoreCase("shutdown"))
			{
				shutdown();
				return new JSONObject("{\"answer\":\"done\"}");
			}
		}
		return null;
	}

	private void shutdown()
	{
		if (server != null)
		{
			try
			{
				server.stop();
			}
			catch (Exception e)
			{
				ExceptionHandler.showErrorDialog(e);
				logger.error("", e);
			}
		}
	}

	@Override
	protected void sendMessage(Component component, JSONObject msg,
			Consumer<JSONObject> onAnswer) throws InterruptedException
	{
		super.sendMessage(component, msg, onAnswer);
	}

	@Override
	protected void sendMessage(Component component, JSONObject msg)
			throws InterruptedException
	{
		super.sendMessage(component, msg);
	}
	
	public void setGui(Gui gui)
	{
		this.gui = gui;
	}
	
	Gui getGui()
	{
		return gui;
	}
	
	public MyHandler getHandler()
	{
		return handler;
	}
}