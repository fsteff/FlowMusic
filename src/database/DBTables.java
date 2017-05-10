package database;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public enum DBTables implements DBAttributes
{
	Playlist(PLAYLIST_ID, NAME),
	PlaylistEntry(PLAYLIST_ID, SONG_ID, NR),
	Artist(ID, NAME),
	Song(ID, ARTIST_ID, YEAR, TITLE),
	Album(ID, NAME),
	AlbumEntry(ALBUM_ID, SONG_ID),
	Source(ID, SONG_ID, TYPE, VALUE),
	Tag(NAME, SONG_ID);

	private final List<String> attributes;
	
	private DBTables(String... attributes)
	{
		this.attributes = Arrays.stream(attributes)
				.collect(Collectors.toList());
	}

	public List<String> getAttributes()
	{
		return Collections.unmodifiableList(attributes);
	}
	public String getNameToLowerCase()
	{
		return name().toLowerCase();
	}
}
