package database;

public interface DBAttributes
{
	// TODO 
	/*Table Playlist: */
	String ID = "id";
	String NAME = "name";
	
	/*Table PlaylistEntry: */
	String PLAYLIST_ID = "playlistId";
	String SONG_ID = "songId";
	String NR = "nr";
	
	/*Table Artist: */
	String ARTIST_ID = "artistId";
	
	/*Table Song: */
	String YEAR = "year";
	String TITLE = "title";
	
	/*Table AlbumEntry: */
	String ALBUM_ID = "albumId";
	
	/*Table Source: */
	String TYPE = "type";
	String VALUE = "value";
}
