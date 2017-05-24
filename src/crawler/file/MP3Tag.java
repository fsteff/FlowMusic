package crawler.file;

/**
 * Contains all information about the MP3-Tag. The positions are based on
 * the start position in the tag.
 * <p>
 * e.g. Position 128 in Tag => size of File - 128 is the file position.
 * 
 * @author Michael Ratzenböck
 */
public enum MP3Tag
{
	TAG("Tag", 128, 3),
	TITLE("Titel", 125, 30),
	ARTIST("Interpret", 95, 30),
	ALBUM("Album", 65, 30),
	YEAR("Jahr", 35, 4),
	COMMENT("Kommentar", 31, 30),
	GENRE("Genre", 1, 1);

	/**
	 * Size of the Tag in bytes.
	 */
	public static final int TAG_SIZE = 128;

	/**
	 * name of the Tag.
	 */
	private final String name;
	/**
	 * The position in the Tag.
	 */
	private final long position;
	/**
	 * Size of the tag component in bytes.
	 */
	private final int length;

	private MP3Tag(String name, long position, int length)
	{
		this.name = name;
		this.position = position;
		this.length = length;
	}

	public String getName()
	{
		return name;
	}

	public long getPosition()
	{
		return position;
	}

	public int getLength()
	{
		return length;
	}

	@Override
	public String toString()
	{
		return "name: " + name + ", position: " + position + ", size: "
				+ length;
	}
}