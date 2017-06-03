package crawler.file;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;

import org.jaudiotagger.audio.exceptions.InvalidAudioFrameException;
import org.jaudiotagger.audio.exceptions.ReadOnlyFileException;
import org.jaudiotagger.tag.FieldKey;
import org.jaudiotagger.tag.TagException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This implementation of the {@link AbstractFile} should be used to get
 * detailed information about MP3 Files.
 * 
 * @author Michael Ratzenböck
 * @see AbstractFile
 */
public class MP3File extends AbstractFile
{
	private static final Logger logger = LoggerFactory
			.getLogger(MP3File.class);

	/** Contains all necessary information about the MP3 File. */
	private final Tag tag;

	public MP3File(String path) throws IllegalArgumentException
	{
		this(new File(path));
	}

	public MP3File(File file) throws IllegalArgumentException
	{
		super(file);

		tag = readTag();
	}

	/**
	 * Reads and saves the Tag information of the file.
	 * 
	 * @return the tag information of the file.
	 * @throws IllegalArgumentException
	 *             if the given file does not contain the ID3-Tag.
	 */
	private Tag readTag() throws IllegalArgumentException
	{
		Tag ret = null;

		if (file.exists() && file.length() > 128)
		{
			ret = new Tag(file);
		}
		return ret;
	}

	public String getTitle()
	{
		return tag.getTitle();
	}

	public String getArtist()
	{
		return tag.getArtist();
	}

	public String getAlbum()
	{
		return tag.getAlbum();
	}

	public String getYear()
	{
		return tag.getYear();
	}

	public String getComment()
	{
		return tag.getComment();
	}

	public String getGenre()
	{
		return "" + tag.getGenre();
	}

	@Override
	public String toString()
	{
		return "Dir: " + file.getPath() + " Tag: " + tag;
	}

	@Override
	public int hashCode()
	{
		final int prime = 31;
		int result = 1;
		result = prime * result + ((tag == null) ? 0 : tag.hashCode());
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
		MP3File other = (MP3File) obj;
		if (tag == null)
		{
			if (other.tag != null)
				return false;
		}
		else if (!tag.equals(other.tag))
			return false;
		return true;
	}

	/**
	 * This class saves the MP3-Tag of the file. If no tag is found, an
	 * {@link IllegalArgumentException} gets thrown.
	 * 
	 * @author Michael Ratzenböck
	 */
	private static class Tag
	{
		private String title = "";
		private String artist = "";
		private String album = "";
		private String year = "";
		private String comment = "";
		private String genre = "";

		public Tag(File file)
		{
			try
			{
				org.jaudiotagger.audio.mp3.MP3File mp3File = new org.jaudiotagger.audio.mp3.MP3File(file);
				org.jaudiotagger.tag.Tag tag = mp3File.getTag();

				if (tag != null)
				{
					title = fixEncoding(tag.getFirst(FieldKey.TITLE))
							.trim();
					artist = fixEncoding(tag.getFirst(FieldKey.ARTIST))
							.trim();
					album = fixEncoding(tag.getFirst(FieldKey.ALBUM))
							.trim();
					year = fixEncoding(tag.getFirst(FieldKey.YEAR)).trim();
					comment = fixEncoding(tag.getFirst(FieldKey.COMMENT))
							.trim();
					genre = fixEncoding(tag.getFirst(FieldKey.GENRE)).trim();
				}
				else
				{
					throw new IllegalArgumentException(
							"The file does not contain a ID3-Tag! => no MP3 file!");
				}
			}
			catch (IOException | TagException | ReadOnlyFileException
					| InvalidAudioFrameException e)
			{
				logger.error("", e);
			}
		}

		public String getTitle()
		{
			return title;
		}

		public String getArtist()
		{
			return artist;
		}

		public String getAlbum()
		{
			return album;
		}

		public String getYear()
		{
			return year;
		}

		public String getComment()
		{
			return comment;
		}

		public String getGenre()
		{
			return genre;
		}

		@Override
		public String toString()
		{
			return "Title: " + getTitle() + " - " + getArtist();
		}
		
		@Override
		public int hashCode()
		{
			final int prime = 31;
			int result = 1;
			result = prime * result
					+ ((album == null) ? 0 : album.hashCode());
			result = prime * result
					+ ((artist == null) ? 0 : artist.hashCode());
			result = prime * result
					+ ((comment == null) ? 0 : comment.hashCode());
			result = prime * result
					+ ((genre == null) ? 0 : genre.hashCode());
			result = prime * result
					+ ((title == null) ? 0 : title.hashCode());
			result = prime * result
					+ ((year == null) ? 0 : year.hashCode());
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
			Tag other = (Tag) obj;
			if (album == null)
			{
				if (other.album != null)
					return false;
			}
			else if (!album.equals(other.album))
				return false;
			if (artist == null)
			{
				if (other.artist != null)
					return false;
			}
			else if (!artist.equals(other.artist))
				return false;
			if (comment == null)
			{
				if (other.comment != null)
					return false;
			}
			else if (!comment.equals(other.comment))
				return false;
			if (genre == null)
			{
				if (other.genre != null)
					return false;
			}
			else if (!genre.equals(other.genre))
				return false;
			if (title == null)
			{
				if (other.title != null)
					return false;
			}
			else if (!title.equals(other.title))
				return false;
			if (year == null)
			{
				if (other.year != null)
					return false;
			}
			else if (!year.equals(other.year))
				return false;
			return true;
		}

		private static String fixEncoding(String latin1)
		{
			try
			{
				byte[] bytes = latin1.getBytes("ISO-8859-1");
				if (bytes.length == 0 || bytes[0] == 0)
				{
					return "";
				}
				if (!validUTF8(bytes))
					return latin1;
				return new String(bytes, "UTF-8");
			}
			catch (UnsupportedEncodingException e)
			{
				// Impossible, throw unchecked
				throw new IllegalStateException(
						"No Latin1 or UTF-8: " + e.getMessage());
			}

		}

		private static boolean validUTF8(byte[] input)
		{
			int i = 0;
			// Check for BOM
			if (input.length >= 3 && (input[0] & 0xFF) == 0xEF
					&& (input[1] & 0xFF) == 0xBB
							& (input[2] & 0xFF) == 0xBF)
			{
				i = 3;
			}

			int end;
			for (int j = input.length; i < j; ++i)
			{
				int octet = input[i];
				if ((octet & 0x80) == 0)
				{
					continue; // ASCII
				}

				// Check for UTF-8 leading byte
				if ((octet & 0xE0) == 0xC0)
				{
					end = i + 1;
				}
				else if ((octet & 0xF0) == 0xE0)
				{
					end = i + 2;
				}
				else if ((octet & 0xF8) == 0xF0)
				{
					end = i + 3;
				}
				else
				{
					// Java only supports BMP so 3 is max
					return false;
				}

				while (i < end)
				{
					i++;
					octet = input[i];
					if ((octet & 0xC0) != 0x80)
					{
						// Not a valid trailing byte
						return false;
					}
				}
			}
			return true;
		}
	}
}