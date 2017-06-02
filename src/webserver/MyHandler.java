package webserver;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Date;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.TimeUnit;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import central.Component;
import database.DBAttributes;
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
	 * Identifies a HEAD request.
	 */
	protected static final String HEAD = "HEAD";
	/**
	 * Identifies the ID of the song that is requested by FlowMusicUI.
	 */
	protected static final String ID = "id";

	public static final int HTTP_DEFAULT_CHUNK_SIZE = 1024 * 1024;
	public static final int IO_BUFFER_SIZE = 4096;

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

		System.out.println("Method: " + method);
		System.out.println("Target: " + target);
		if (method.equals(GET))
		{
			handeld = handleGet(target, baseRequest, request, response);
		}
		else if (method.equals(POST))
		{
			handeld = handlePost(target, baseRequest, request, response);
		}
		else if (method.equals(HEAD))
		{
			handeld = handleHead(target, request, response);
		}

		if (handeld)
		{
			response.setStatus(HttpServletResponse.SC_OK);
		}
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
			String pathToSong = getPathFromID(id);
			String range = request.getHeader("Range");

			/* If no range is specified send all... */
			if (range == null)
			{
				try (OutputStream out = response.getOutputStream())
				{
					Files.copy(Paths.get(pathToSong), out);
				}
			}

			else
			{
				sendInChunks(response, pathToSong, range);
			}

			return true;
		}
		/*
		 * A polling request by FlowMusicUI that checks if something is in
		 * the browser queue.
		 */
		if (target.equals(URL_IN_MSG))
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

	private boolean handleHead(String target, HttpServletRequest request,
			HttpServletResponse response)
			throws IOException, ServletException
	{
		String id = request.getParameter(ID);
		String pathToSong = getPathFromID(id);
		
		if (Files.exists(Paths.get(pathToSong)))
		{
			response.setHeader("Content-Length", ""+new File(pathToSong).length());
			response.setHeader("Content-Type", "audio/mpeg");
			return true;
		}
		else
		{
			return false;
		}
	}

	private void sendInChunks(HttpServletResponse response,
			String pathToSong, String range)
			throws FileNotFoundException, IOException
	{
		File f = new File(pathToSong);

		String[] ranges = range.split("=")[1].split("-");
		int from = Integer.parseInt(ranges[0]);
		/*
		 * some clients, like chrome will send a range header but won't
		 * actually specify the upper bound. For them we want to send out
		 * our song in chunks.
		 */
		int to = HTTP_DEFAULT_CHUNK_SIZE + from;
		if (to >= f.length())
		{
			to = (int) (f.length() - 1);
		}
		if (ranges.length == 2)
		{
			to = Integer.parseInt(ranges[1]);
		}
		int len = to - from + 1;

		response.setStatus(206);
		response.setHeader("Accept-Ranges", "bytes");
		String responseRange = String.format("bytes %d-%d/%d", from, to,
				f.length());

		response.setHeader("Content-Range", responseRange);
		response.setDateHeader("Last-Modified", new Date().getTime());
		response.setContentLength(len);

		RandomAccessFile raf = new RandomAccessFile(f, "r");
		raf.seek(from);
		byte[] buf = new byte[IO_BUFFER_SIZE];
		try (OutputStream os = response.getOutputStream())
		{
			while (len != 0)
			{
				int read = raf.read(buf, 0,
						buf.length > len ? len : buf.length);
				os.write(buf, 0, read);
				len -= read;
			}
		}
		finally
		{
			raf.close();
		}
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
		//return "C:\\Users\\Michael\\Music\\test.mp3";
		
		JSONObject msg = new JSONObject();
		JSONObject filter = new JSONObject();
		filter.put(DBAttributes.SOURCE_ID, Integer.parseInt(id));
		msg.put("command", "get").put("what", "source").put("filter", filter);
		final LinkedBlockingDeque<String> queue = new LinkedBlockingDeque<>();
		
			try
			{
				webserver.sendMessage(Component.DATABASE, msg, answer ->{
					try
					{
						queue.putFirst(answer.toString());
					}
					catch (InterruptedException e)
					{
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
				});
			}
			catch (InterruptedException e)
			{
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			
			try
			{
				JSONObject answer = new JSONObject(queue.takeFirst());
				JSONArray ret = answer.getJSONArray("answer");
				JSONObject source = ret.getJSONObject(0);
				return source.getString("value");
			}
			catch (InterruptedException e)
			{
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			throw new IllegalArgumentException("There is no answer from the database...");
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