package webserver;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import central.Central;
import central.Component;
import central.ExceptionHandler;
import webserver.utils.JSLogger;

public class MyHandler extends AbstractHandler
{
	protected static final String LOG = "/log";
	protected static final String MSG = "/msg";
	protected static final String RECEIVER = "receiver";
	protected static final String POST = "POST";
	protected static final String GET = "GET";
	protected static final String SONG = "/song";
	protected static final String ID = "id";
	private final Central central;

	private static final Logger logger = LoggerFactory
			.getLogger(MyHandler.class);

	public MyHandler(Central central)
	{
		this.central = central;
	}

	public void handle(String target, Request baseRequest,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException
	{
		String method = baseRequest.getMethod();

		System.out.println(target);
		System.out.println(method);

		if (method.equals(GET))
		{
			handleGet(target, baseRequest, request, response);
		}

		if (method.equals("GET"))
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
			catch(FileNotFoundException e)
			{
				logger.error("",e);
			}
		}
		if (method.equals(POST))
		{
			handlePost(target, baseRequest, request, response);
		}

		response.setStatus(HttpServletResponse.SC_OK);
		baseRequest.setHandled(true);
	}

	private void handleGet(String target, Request baseRequest,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException
	{
		if (target.equals(SONG))
		{
			String id = request.getParameter(ID);
		}
	}

	private void handlePost(String target, Request baseRequest,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException
	{
		if (target.equals(LOG))
		{
			logMessage(request);
		}

		if (target.equals(MSG))
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
		String msg = request.getParameter(MSG);
		String receiver = request.getParameter(RECEIVER);

		try
		{
			Component comp = Component.valueOf(receiver.toUpperCase());
			// Could cause an exception if msg has not the json format.
			central.sendMessage(comp, new JSONObject(msg));
		}
		catch (JSONException | InterruptedException e)
		{
			logger.error("", e);
			ExceptionHandler.showErrorDialog(e);
		}
	}
}