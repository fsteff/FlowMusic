package crawler.file;

/**
 * Diese Enumeration beinhaltet alle Informationen zum MP3-Tag. Die Angabe
 * der Position bezieht sich immer auf die Startposition im Tag.
 * <p>
 * Z.B. Position 128 im Tag => Größe des Files - 128 für die Position im
 * File.
 * 
 * @author mratzenb
 * @since 1.0
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
	 * Größe des Tags in Byte.
	 */
	public static final int TAG_SIZE = 128;

	/**
	 * Name des Tags
	 */
	private final String name;
	/**
	 * Position im Tag
	 */
	private final long position;
	/**
	 * Größe des Tags in Byte.
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
		return "Name: " + name + ", Postition: " + position + ", Länge: "
				+ length;
	}
}