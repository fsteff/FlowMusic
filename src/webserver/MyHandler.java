package webserver;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.TimeUnit;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import utils.JSLogger;

public class MyHandler extends AbstractHandler
{
	protected static final String URL_LOG = "/log";
	protected static final String URL_MSG = "/msg";
	protected static final String URL_IN_MSG = "/inmsg";
	protected static final String URL_SONG = "/song";
	protected static final String MESSAGE = "msg";
	protected static final String RECEIVER = "receiver";
	protected static final String POST = "POST";
	protected static final String GET = "GET";	
	protected static final String ID = "id";
	private final Webserver webserver;
	private final Gui gui;
	
	
	
	
	private static final Logger logger = LoggerFactory
			.getLogger(MyHandler.class);

	public MyHandler(Webserver webserver, Gui gui)
	{
		this.webserver = webserver;
		this.gui = gui;
	}

	public void handle(String target, Request baseRequest,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException
	{
		String method = baseRequest.getMethod();

		System.out.println(target);
		System.out.println(method);

		boolean handled = false;
		if (method.equals(GET))
		{
			handled = handleGet(target, baseRequest, request, response);
		}

		if (method.equals("GET") && !handled)
		{
			try
			{
				OutputStream os = response.getOutputStream();
				InputStream is = new FileInputStream(
						"C:\\Users\\Michael\\Desktop\\Alan Walker - Alone.mp3");

				byte[] buf = new byte[4096];
				int readBytes;

				while ((readBytes = is.read(buf)) != -1)
				{
					os.write(buf, 0, readBytes);
				}
				os.flush();
				is.close();
				os.close();
			}
			catch (FileNotFoundException e)
			{
				logger.error("", e);
			}
		}
		if (method.equals(POST))
		{
			handlePost(target, baseRequest, request, response);
		}

		response.setStatus(HttpServletResponse.SC_OK);
		baseRequest.setHandled(true);
	}

	private boolean handleGet(String target, Request baseRequest,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException
	{
		if (target.equals(URL_SONG))
		{
			String id = request.getParameter(ID);
		}
		else if (target.equals(URL_IN_MSG))
		{
			try
			{
				JSONObject obj = gui.toBrowserQueue.poll(5L, TimeUnit.SECONDS);
				OutputStream os = response.getOutputStream();
				
				if (obj == null)
				{
					obj = new JSONObject();
				}
				
				os.write(obj.toString().getBytes());
				os.flush();
				
				os.close();
				return true;
			}
			catch (InterruptedException e)
			{
				logger.error("", e);
			}
		}
		return false;
	}

	private void handlePost(String target, Request baseRequest,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException
	{
		if (target.equals(URL_LOG))
		{
			logMessage(request);
		}

		if (target.equals(URL_MSG))
		{
			sendMessage(request);
		}
	}

	private void logMessage(HttpServletRequest request)
	{
		String msg = request.getParameter(JSLogger.MESSAGE);
		String level = request.getParameter(JSLogger.LEVEL);

		JSLogger.log(level.toUpperCase(), msg);
	}

	private void sendMessage(HttpServletRequest request)
	{
		String msg = request.getParameter(MESSAGE);
		try
		{
			gui.messageIncoming(new JSONObject(msg));
		}
		catch (JSONException | InterruptedException e)
		{
			logger.error("", e);
		}
	}
}