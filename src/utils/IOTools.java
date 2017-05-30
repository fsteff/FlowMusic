package utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import central.ExceptionHandler;

/**
 * This class provides some utilities methods for IO use.
 * 
 * @author Michael Ratzenböck
 */
public final class IOTools
{
	private static final Logger logger = LoggerFactory
			.getLogger(IOTools.class);

	private IOTools()
	{

	}

	/**
	 * Writes the given File to the given OutputStream.
	 * 
	 * @param path
	 *            the Path to the File as String.
	 * @param os
	 *            the OutputStream
	 * @throws RuntimeException
	 *             if the File does not exist
	 * @see #writeTo(File, OutputStream)
	 */
	public static void writeTo(String path, OutputStream os) throws IOException
	{
		final Path p = Paths.get(path);

		if (Files.exists(p))
		{
			writeTo(new File(path), os);
		}
		else
		{
			IllegalArgumentException e = new IllegalArgumentException(
					"The File with the given path does not exist: "
							+ path);
			logger.error("", e);
			ExceptionHandler.showErrorDialog(e);
			throw e;
		}
	}

	/**
	 * Writes the given File to the given OutputStream.
	 * <p>
	 * If an exception occurs it gets caught showed and logged.
	 * 
	 * @param file
	 *            The File that should be written.
	 * @param os
	 *            The OutputStream.
	 */
	public static void writeTo(File file, OutputStream os) throws IOException
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