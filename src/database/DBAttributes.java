package database;

public interface DBAttributes
{
	// TODO 
	/*Table Playlist: */
	String PLAYLIST_ID = "playlistid";
	String NAME = "name";
	String TIMESTAMP = "timestamp";
	
	/*Table PlaylistEntry: */
	String SONG_ID = "songid";
	String NR = "nr";
	
	/*Table Artist: */
	String ARTIST_ID = "artistid";
	String ARTIST_NAME = "artist";
	
	/*Table Song: */
	String YEAR = "year";
	String TITLE = "title";
	
	/*Table AlbumEntry: */
	String ALBUM_ID = "albumid";
	String ALBUM_NAME = "album";
	
	/*Table Source: */
	String SOURCE_ID = "sourceid";
	String TYPE = "type";
	String VALUE = "value";
	
	/*Table Tag: */
	String TAG_NAME = "tagname";
}
