package utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import central.ExceptionHandler;

public final class IOTools
{
	private static final Logger logger = LoggerFactory
			.getLogger(IOTools.class);

	private IOTools()
	{

	}

	public static void writeTo(String path, OutputStream os)
			throws FileNotFoundException
	{
		final Path p = Paths.get(path);

		if (Files.exists(p))
		{
			writeTo(new File(path), os);
		}
		else
		{
			RuntimeException e = new RuntimeException(
					"The File with the given path does not exist: "
							+ path);
			logger.error("", e);
			ExceptionHandler.showErrorDialog(e);
			throw e;
		}
	}

	public static void writeTo(File file, OutputStream os)
	{
		InputStream is = null;

		try
		{
			is = new FileInputStream(file);
			byte[] buf = new byte[4096];
			int readBytes;

			while ((readBytes = is.read(buf)) != -1)
			{
				os.write(buf, 0, readBytes);
			}
			os.flush();
		}
		catch (IOException e)
		{
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		}
		finally
		{
			if (is != null)
			{
				try
				{
					is.close();
				}
				catch (IOException e)
				{
					logger.error("", e);
				}
			}
			if (os != null)
			{
				try
				{
					os.close();
				}
				catch (IOException e)
				{
					logger.error("", e);
				}
			}
		}
	}
}