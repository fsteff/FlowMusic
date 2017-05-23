package webserver;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
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

import utils.IOTools;
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
		boolean handeld = false;
		System.out.print("Target: "+target);
		System.out.println(" Method: "+method);

		if (method.equals(GET))
		{
			handeld = handleGet(target, baseRequest, request, response);
		}
		if (method.equals(POST))
		{
			handeld = handlePost(target, baseRequest, request, response);
		}

		response.setStatus(HttpServletResponse.SC_OK);
		baseRequest.setHandled(handeld);
	}

	private boolean handleGet(String target, Request baseRequest,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException
	{
		if (target.equals(URL_SONG))
		{
			String id = request.getParameter(ID);
			System.out.println("Song id: " + id);
			String pathToSong = getPathFromID(id);
			System.out.println("Sendig song...");
			
			IOTools.writeTo(new File(pathToSong),
					response.getOutputStream());
			return true;
		}
		else if (target.equals(URL_IN_MSG))
		{
			try
			{
				JSONObject obj = gui.toBrowserQueue.poll(5L,
						TimeUnit.SECONDS);
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

	private String getPathFromID(String id)
	{
		// TODO: Get path from DB
		return "C:\\Users\\Michael\\Music\\test.mp3";
	}

	private boolean handlePost(String target, Request baseRequest,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException
	{
		boolean ret = false;

		if (target.equals(URL_LOG))
		{
			logMessage(request);
			ret = true;
		}

		if (target.equals(URL_MSG))
		{
			sendMessage(request);
			ret = true;
		}
		return ret;
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