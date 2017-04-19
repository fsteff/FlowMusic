package webserver;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;

public class MyHandler extends AbstractHandler
{
	public void handle(String target, Request baseRequest,
			HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException
	{
		System.out.println(target);
		
		OutputStream os = response.getOutputStream();
		InputStream is = new FileInputStream("samples\\Alan Walker - Alone.mp3");
		
		byte[] buf = new byte[4096];
		int readBytes;

		while ((readBytes = is.read(buf)) != -1)
		{
			os.write(buf, 0, readBytes);
		}
		os.flush();
		is.close();
		os.close();
		
		response.setStatus(HttpServletResponse.SC_OK);
		baseRequest.setHandled(true);
	}
}