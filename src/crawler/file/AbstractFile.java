package crawler.file;

import java.io.File;
import java.security.InvalidParameterException;
import java.text.Collator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import central.ExceptionHandler;

/**
 * Use this class for all specific file implementations. It provides some
 * basic methods to access the {@link File} properties.
 * 
 * @author Michael Ratzenböck
 * @see MP3File
 */
public abstract class AbstractFile implements Comparable<AbstractFile>
{
	private static final Logger logger = LoggerFactory
			.getLogger(AbstractFile.class);

	protected final File file;

	protected AbstractFile(String path)
	{
		this(new File(path));
	}

	protected AbstractFile(File file)
	{
		if (file == null)
		{
			NullPointerException npe = new NullPointerException(
					"File must not null!");
			ExceptionHandler.showErrorDialog(npe);
			logger.error("", npe);
			throw npe;
		}
		else if (file.getParentFile() == null
				&& !file.getParentFile().exists())
		{
			InvalidParameterException ipe = new InvalidParameterException(
					"File has to have an exsisting Parentpath!");
			ExceptionHandler.showErrorDialog(ipe);
			logger.error("", ipe);
			throw ipe;
		}
		this.file = file;
	}

	public String getSuffix()
	{
		int lastIndex = file.getName().lastIndexOf('.');

		return file.getName().substring(lastIndex + 1);
	}

	public String getFileName()
	{
		return file.getName();
	}

	/**
	 * @return the filename without the suffix.
	 */
	public String getPureFileName()
	{
		return getFileName().substring(0, getFileName().lastIndexOf('.'));
	}

	public long getSize()
	{
		return file.length();
	}

	public String getPath()
	{
		return file.getPath();
	}

	@Override
	public int hashCode()
	{
		final int prime = 31;
		int result = 1;
		result = prime * result + ((file == null) ? 0 : file.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj)
	{
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		AbstractFile other = (AbstractFile) obj;
		if (file == null)
		{
			if (other.file != null)
				return false;
		}
		else if (!file.equals(other.file))
			return false;
		return true;
	}

	public int compareTo(AbstractFile o)
	{
		return Collator.getInstance().compare(o.getFileName(),
				getFileName());
	}
}