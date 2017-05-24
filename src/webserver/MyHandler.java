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

/**
 * The handler of our Webserver that handles all kinds of requests.
 * 
 * @author Michael Ratzenböck
 */
public class MyHandler extends AbstractHandler
{
	/**
	 * Identifies a log message from FlowMusicUI
	 */
	protected static final String URL_LOG = "/log";
	/**
	 * Identifies if a message from FlowMusicUI should be broadcasted.
	 */
	protected static final String URL_MSG = "/msg";
	/**
	 * Identifies a polling request from FlowMusicUI.
	 */
	protected static final String URL_IN_MSG = "/inmsg";
	/**
	 * Identifies a streaming request of a local song.
	 */
	protected static final String URL_SONG = "/song";
	/**
	 * Is the JSON-Object key of the message that should be broadcasted.
	 */
	protected static final String MESSAGE = "msg";
	/**
	 * Is the JSON-Object key that identifies the receiver of the message,
	 * that should be broadcasted.
	 */
	protected static final String RECEIVER = "receiver";
	/**
	 * Identifies a POST request.
	 */
	protected static final String POST = "POST";
	/**
	 * Identifies a GET request.
	 */
	protected static final String GET = "GET";
	/**
	 * Identifies the ID of the song that is requested by FlowMusicUI.
	 */
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

	@Override
	public void handle(String target, Request baseRequest,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException
	{
		String method = baseRequest.getMethod();
		boolean handeld = false;
		System.out.print("Target: " + target);
		System.out.println(" Method: " + method);

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

	/**
	 * Handles all sorts of GET requests.
	 * 
	 * @return if the request was handled.
	 */
	private boolean handleGet(String target, Request baseRequest,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException
	{
		/* A song is requested by the FlowMusicUI. */
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
		/*
		 * A polling request by FlowMusicUI that checks if something is in
		 * the browser queue.
		 */
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

	/**
	 * Returns the local path of the given song id from the database.
	 * 
	 * @param id
	 *            the sourceId from the song.
	 * @return the local path of the given song id
	 */
	private String getPathFromID(String id)
	{
		// TODO: Get path from DB
		return "C:\\Users\\Michael\\Music\\test.mp3";
	}

	/**
	 * Handles all kind of POST requests.
	 * 
	 * @return If the request was handled.
	 */
	private boolean handlePost(String target, Request baseRequest,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException
	{
		boolean ret = false;

		/* A log message from FlowMusicUI. */
		if (target.equals(URL_LOG))
		{
			logMessage(request);
			ret = true;
		}
		/*
		 * A message from FlowMusicUI to the Webserver that should be
		 * broadcasted.
		 */
		else if (target.equals(URL_MSG))
		{
			sendMessage(request);
			ret = true;
		}
		return ret;
	}

	/**
	 * Logs a message from FlowMusicUI.
	 * 
	 * @param request
	 */
	private void logMessage(HttpServletRequest request)
	{
		String msg = request.getParameter(JSLogger.MESSAGE);
		String level = request.getParameter(JSLogger.LEVEL);

		JSLogger.log(level.toUpperCase(), msg);
	}

	/**
	 * Sends the message from the request to the receiver.
	 * 
	 * @param request
	 */
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