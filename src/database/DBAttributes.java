package database;

public interface DBAttributes
{
	// TODO 
	/*Table Playlist: */
	String PLAYLIST_ID = "playlistId";
	String NAME = "name";
	
	/*Table PlaylistEntry: */
	String SONG_ID = "songId";
	String NR = "nr";
	
	/*Table Artist: */
	String ARTIST_ID = "artistId";
	String ARTIST_NAME = "artist";
	
	/*Table Song: */
	String YEAR = "year";
	String TITLE = "title";
	
	/*Table AlbumEntry: */
	String ALBUM_ID = "albumId";
	String ALBUM_NAME = "album";
	
	/*Table Source: */
	String SOURCE_ID = "sourceId";
	String TYPE = "type";
	String VALUE = "value";
	
	/*Table Tag: */
	String TAG_NAME = "tagname";
}
