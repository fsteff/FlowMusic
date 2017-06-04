package database;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;

import org.json.JSONArray;
import org.json.JSONObject;

import central.Central;
import central.Component;
import central.ExceptionHandler;
import central.ThreadedComponent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Database Class that that creates and changes a local Database.
 * 
 * @author Gregor Pertl
 */

public class Database extends ThreadedComponent {
	Connection databaseConnection;
	Statement statement;
	private static final Logger logger = LoggerFactory.getLogger(Database.class);

	/**
	 * Creates H2 Database, which is a Java SQL database
	 * 
	 * @param folder
	 *            : folder for database location
	 */

	public Database(Central central, File folder) {
		super(Component.DATABASE, central);
		// DataBase creation:
		try {
			// Save the database at the user home directory, subdirectory
			// .Flowmusic
			String dbName = "~/.FlowMusic/data";
			// or, if specified, use this instead
			if (folder != null && folder.getParentFile().exists()) {
				dbName = folder.getAbsolutePath();
			}
			Class.forName("org.h2.Driver");
			databaseConnection = DriverManager.getConnection("jdbc:h2:" + dbName);
		} catch (ClassNotFoundException e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} catch (SQLException e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} finally {
			try {
				if (statement != null) {
					statement.close();
				}
			} catch (SQLException e) {
				ExceptionHandler.showErrorDialog(e);
				logger.error("", e);
			}
		}
	}

	/**
	 * Executes sent commands. Except for the database creation, every other
	 * method in this class is executed by this method.
	 * 
	 * @return Depending on the command returns views, id, etc....
	 */

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg) throws Exception {
		String command = msg.getString("command");
		JSONObject ret = new JSONObject();
		String what;
		if (msg.has("what") && !msg.isNull("what")) {
			what = msg.getString("what");
		} else {
			what = "";
		}

		switch (command) {

		case "start":
			addAllTables();
			ret.put("answer", "done");
			return ret;

		case "get":
			String filter = "";
			if (msg.get("filter") instanceof JSONObject) {
				JSONObject obj = (JSONObject) msg.get("filter");
				DBTables[] tables = DBTables.values();
				for (int i = 0; i < tables.length; i++) {
					for (int j = 0; j < tables[i].getAttributes().size(); j++) {
						filter = obj.optString(tables[i].getAttributes().get(j), filter);
					}
				}
			} else {
				filter = msg.get("filter").toString();
			}

			JSONArray found = new JSONArray();

			switch (what) {
			case "song":
				switch (filter) {
				case "*":
					found = getAllSongInformation();
					break;

				default:
					found = search(filter);
					break;
				}
				break;

			case "source":
				found = getSource(msg.getJSONObject("filter").getInt(DBAttributes.SOURCE_ID));
				break;

			case "ViewPlaylistSongs":
				if (msg.getJSONObject("filter").get(DBAttributes.PLAYLIST_ID).toString().equals("*")) {
					found = getPlaylists();
				} else {
					found = getPlaylist(msg.getJSONObject("filter").getInt(DBAttributes.PLAYLIST_ID));
				}
				break;
			default:

				break;
			}
			ret.put("answer", found);
			return ret;

		case "updateFolder":
			JSONArray update = msg.getJSONArray("found");
			removeLocalData(update);
			for (int i = 0; i < update.length(); i++) {
				update.getJSONObject(i).put(DBAttributes.VALUE, update.getJSONObject(i).getString("path"));
				update.getJSONObject(i).put(DBAttributes.TYPE, "local");
				addSong(update.getJSONObject(i));
			}
			logger.info("done");
			break;

		case "update":
			break;

		case "insertSong":
			JSONObject newSong = new JSONObject();
			newSong.put(DBAttributes.TITLE, msg.get(DBAttributes.TITLE));
			newSong.put(DBAttributes.TYPE, msg.getJSONArray("sources").getJSONObject(0).get(DBAttributes.TYPE));
			newSong.put(DBAttributes.VALUE, msg.getJSONArray("sources").getJSONObject(0).get(DBAttributes.VALUE));
			if (msg.has(DBAttributes.ARTIST_NAME)) {
				newSong.put(DBAttributes.ARTIST_NAME, msg.get(DBAttributes.ARTIST_NAME));
			}
			if (msg.has(DBAttributes.YEAR)) {
				newSong.put(DBAttributes.YEAR, msg.get(DBAttributes.YEAR));
			}
			if (msg.has(DBAttributes.ALBUM_NAME)) {
				newSong.put(DBAttributes.ALBUM_NAME, msg.get(DBAttributes.ALBUM_NAME));
			}
			if (msg.has(DBAttributes.TAG_NAME)) {
				newSong.put(DBAttributes.TAG_NAME, msg.get(DBAttributes.TAG_NAME));
			}
			addSong(newSong);
			ret.put("answer", "done");
			return ret;

		case "insertPlaylist":
			return ret.put("answer", addPlaylist(msg.getString(DBAttributes.NAME)));

		case "addSongToPlaylist":
			addSongToPlaylist(msg.getInt(DBAttributes.SONG_ID), msg.getInt(DBAttributes.PLAYLIST_ID), 1);
			break;

		case "delete":
			switch (what) {
			case "song":
				removeSong(msg.getInt(DBAttributes.SONG_ID));
				break;

			case "playlist":
				removePlaylist(msg.getInt(DBAttributes.PLAYLIST_ID));
				break;
			}
			break;

		default:
		}
		return null;
	}

	/**
	 * Removes a playlist from table playlist and table playlistentry
	 * 
	 * @param playlistId
	 *            : ID of playlist to delete
	 */

	private void removePlaylist(int playlistId) {
		String remove = "DELETE FROM " + DBTables.Playlist + " WHERE " + DBAttributes.PLAYLIST_ID + " = " + playlistId;
		try {
			statement = databaseConnection.createStatement();
			statement.executeUpdate(remove);
			remove = "DELETE FROM " + DBTables.PlaylistEntry + " WHERE " + DBAttributes.PLAYLIST_ID + " = "
					+ playlistId;
		} catch (SQLException e) {
			logger.info("SQLException");
		} catch (Exception e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} finally {
			try {
				if (statement != null) {
					statement.close();
				}
			} catch (SQLException e) {
				ExceptionHandler.showErrorDialog(e);
				logger.error("", e);
			}
		}
	}

	/**
	 * Executes a Select-SQL-Statement and returns a JSONArray with the found
	 * information.
	 * 
	 * @param query
	 *            : Should be a String with a Select-SQL-Statement.
	 * @return Returns a JSONArray containing JSONObjects for the found
	 *         information in every column of the database
	 */
	
	private JSONArray query(String query) {
		JSONArray result = new JSONArray();
		try {
			Statement stmt = databaseConnection.createStatement();
			ResultSet rs = stmt.executeQuery(query);
			ResultSetMetaData meta = rs.getMetaData();
			while (rs.next()) {
				JSONObject line = new JSONObject();

				for (int i = 1; i <= meta.getColumnCount(); i++) {
					Object obj = rs.getObject(i);
					String columnName = meta.getColumnName(i);
					if (obj instanceof String) {
						line.put(columnName.toLowerCase(), (String) obj);
					} else if (obj instanceof Integer) {
						line.put(columnName.toLowerCase(), (Integer) obj);
					}
				}
				result.put(line);
			}
		} catch (SQLException e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		}
		return result;
	}

	/**
	 * Removes a song from all tables and adjusts tracknumbers in a playlist if
	 * the song was inside of it.
	 * 
	 * @param ID
	 *            : ID of the song to be deleted.
	 */

	private void removeSong(int ID) {
		try {
			String delete = " DELETE FROM " + DBTables.Song + " WHERE " + DBAttributes.SONG_ID + " = " + ID;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(delete);
			delete = " DELETE FROM " + DBTables.Tag + " WHERE " + DBAttributes.SONG_ID + " = " + ID;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(delete);
			delete = " DELETE FROM " + DBTables.Source + " WHERE " + DBAttributes.SONG_ID + " = " + ID;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(delete);
			delete = " DELETE FROM " + DBTables.AlbumEntry + " WHERE " + DBAttributes.SONG_ID + " = " + ID;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(delete);
			delete = " DELETE FROM " + DBTables.PlaylistEntry + " WHERE " + DBAttributes.SONG_ID + " = " + ID;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(delete);
			JSONArray number;
			JSONArray information;
			delete = "SELECT " + DBAttributes.NR + ", " + DBAttributes.PLAYLIST_ID + " FROM " + DBTables.PlaylistEntry
					+ " WHERE " + DBAttributes.SONG_ID + " = " + ID;
			number = query(delete);
			for (int j = 0; j < number.length(); j++) {
				delete = "SELECT " + DBAttributes.NR + ", " + DBAttributes.SONG_ID + " FROM " + DBTables.PlaylistEntry
						+ " WHERE " + DBAttributes.PLAYLIST_ID + " = "
						+ number.getJSONObject(j).getInt(DBAttributes.PLAYLIST_ID) 
						+ " AND " + DBAttributes.NR + " > "
						+ number.getJSONObject(j).getInt(DBAttributes.NR);
				information = query(delete);
				for (int i = 0; i < information.length(); i++) {
					delete = "UPDATE " + DBTables.PlaylistEntry + " SET " + DBAttributes.NR + " = "
							+ (information.getJSONObject(i).getInt(DBAttributes.NR) - 1) 
							+ " WHERE " + DBAttributes.PLAYLIST_ID + " = "
							+ number.getJSONObject(j).getInt(DBAttributes.PLAYLIST_ID) 
							+ " AND " + DBAttributes.SONG_ID
							+ " = " + information.getJSONObject(i).getInt(DBAttributes.SONG_ID);
					statement = databaseConnection.createStatement();
					statement.executeUpdate(delete);
				}
			}
		} catch (SQLException e) {
			logger.error("Problem with Statement...");
			e.printStackTrace();
		} catch (Exception e) {
			logger.error(e.getMessage().toString());
		}
	}

	/**
	 * Removes all local sources not included in the crawler update. To set everything up for the crawler. Also removes songs, if there is no source
	 * left.
	 */

	private void removeLocalData(JSONArray update) {
		String get = "SELECT " + DBAttributes.VALUE + " FROM " + DBTables.Source; 
		JSONArray sources = query(get);
		if(!sources.isNull(0) && !update.isNull(0)){
			for(int i = 0; i < update.length(); i++){
				if(sources.getJSONObject(0).getString(DBAttributes.VALUE).contentEquals(update.getJSONObject(i).getString("path"))){
					sources.remove(0);
				}
				for(int k = 1; k < sources.length(); k++){
					if(sources.getJSONObject(k).getString(DBAttributes.VALUE).contentEquals(update.getJSONObject(i).getString("path"))){
						sources.remove(k);
					}
				}
			}
		}
		String remove;
		for(int i = 0; i < sources.length(); i++){
			remove = "DELETE FROM " + DBTables.Source + " WHERE " + DBAttributes.TYPE + " = 'local' AND " + DBAttributes.VALUE + " = '" + turnToSqlString(sources.getJSONObject(i).getString(DBAttributes.VALUE)) + "'";
			try {
				statement = databaseConnection.createStatement();
				statement.executeUpdate(remove);
			} catch (SQLException e) {
				logger.error("Problem with Statement...");
				e.printStackTrace();
			} catch (Exception e) {
				logger.error(e.getMessage().toString());
			}
		}
		JSONArray songs = getAllSongInformation();
		for (int i = 0; i < songs.length(); i++) {
			if (songs.getJSONObject(i).getJSONArray("sources").length() == 0) {
				removeSong(songs.getJSONObject(i).getInt(DBAttributes.SONG_ID));
			}		
		}
	}

	/**
	 * Looks for all entries with artist, title or albums like the search
	 * String.
	 * 
	 * @param search
	 * @return Gets a JSONArray with a JSONObject of all Songinformation of the
	 *         found songs.
	 */

	private JSONArray search(String search) {
		String get = "SELECT " + DBTables.Song + ".*, " + DBTables.Artist + "." + DBAttributes.ARTIST_NAME + ", "
				+ DBTables.Album + "." + DBAttributes.ALBUM_NAME 
				+ " FROM " + DBTables.Song + ", " + DBTables.Artist + "," + DBTables.Album 
				+ " WHERE " + DBTables.Artist + "." + DBAttributes.ARTIST_ID + " = "
				+ DBTables.Song + "." + DBAttributes.ARTIST_ID 
				+ " AND (LOWER(" + DBTables.Song + "."
						+ DBAttributes.TITLE + ") LIKE '%" + search.toLowerCase() + "%' OR LOWER(" + DBTables.Artist + "."
						+ DBAttributes.ARTIST_NAME + ") LIKE '%" + search.toLowerCase() + "%' OR LOWER(" + DBTables.Album + "."
						+ DBAttributes.ALBUM_NAME + ") LIKE '%" + search.toLowerCase() + "%' )";
		return getAllInfo(get);
	}

	/**
	 * Gets all songs from the database.
	 * 
	 * @return Return a JSONArray with a JSONObject for every song and all their
	 *         information.
	 */

	private JSONArray getAllSongInformation() {
		String get = "SELECT " + DBTables.Song + ".*, " + DBTables.Artist + "." + DBAttributes.ARTIST_NAME 
				+ " FROM " + DBTables.Song + ", " + DBTables.Artist 
				+ " WHERE " + DBTables.Artist + "." + DBAttributes.ARTIST_ID
				+ " = " + DBTables.Song + "." + DBAttributes.ARTIST_ID;
		return getAllInfo(get);
	}

	/**
	 * Gathers all sources, albums and tags and adds them to the by the get
	 * found songs and returns them in a JSONArray.
	 * 
	 * @param get
	 *            : Select-SQL-Statement which has as one of the results the
	 *            song ID.
	 * @return A JSONArray with a JSONObject for every selected song containing
	 *         the sources, albums and tags of the song.
	 */

	private JSONArray getAllInfo(String get) {
		JSONArray songInfo = query(get);
		JSONArray tags;
		JSONArray albums;
		JSONObject obj;
		String id;
		for (int i = 0; i < songInfo.length(); i++) {
			if (songInfo.get(i) instanceof JSONObject) {
				obj = songInfo.getJSONObject(i);
				id = obj.get(DBAttributes.SONG_ID).toString();

				get = "SELECT * FROM " + DBTables.Source + " WHERE " + DBAttributes.SONG_ID + " = " + id;
				songInfo.getJSONObject(i).put("sources", query(get));
				get = "SELECT " + DBAttributes.TAG_NAME + " FROM " + DBTables.Tag 
						+ " WHERE " + DBAttributes.SONG_ID + " = " + id;
				tags = query(get);
				
				for (int j = 0; j < tags.length(); j++) {
					tags.put(j, tags.getJSONObject(j).getString(DBAttributes.TAG_NAME));
				}
				songInfo.getJSONObject(i).put(DBTables.Tag.toString().toLowerCase(), tags);

				get = "SELECT " + DBAttributes.ALBUM_NAME + " FROM " + DBTables.Album + ", " + DBTables.AlbumEntry
						+ " WHERE " + DBTables.Album + "." + DBAttributes.ALBUM_ID + " = " + DBTables.AlbumEntry + "."
						+ DBAttributes.ALBUM_ID 
						+ " AND " + DBTables.AlbumEntry + "." + DBAttributes.SONG_ID + " = " + id;
				songInfo.getJSONObject(i).put(DBAttributes.ALBUM_NAME, query(get));
				albums = query(get);
				
				for (int j = 0; j < tags.length(); j++) {
					albums.put(j, albums.getJSONObject(j).getString(DBAttributes.ALBUM_NAME));
				}
				songInfo.getJSONObject(i).put(DBAttributes.ALBUM_NAME, albums);
			}
		}
		return songInfo;
	}

	/**
	 * Gets the value and type of the searched source.
	 * 
	 * @param sourceId
	 *            : ID of the searched source
	 * @return JSONArray of one JSONObject containing the value and type of the
	 *         searched source.
	 */

	private JSONArray getSource(int sourceId) {
		String get = "SELECT " + DBAttributes.VALUE + ", " + DBAttributes.TYPE + " FROM " + DBTables.Source 
				+ " WHERE "	+ DBAttributes.SOURCE_ID + " = " + sourceId;
		return query(get);
	}

	/**
	 * Gets all information of a certain song.
	 * 
	 * @param songId
	 *            : ID of the searched song.
	 * @return JSONArray with a JSONObject of the searched song containing all
	 *         information of the song.
	 */

	private JSONArray getSong(int songId) {
		String get = "SELECT " + DBTables.Song + ".*, " + DBTables.Artist + "." + DBAttributes.ARTIST_NAME 
				+ " FROM " + DBTables.Song + ", " + DBTables.Artist 
				+ " WHERE " + DBTables.Artist + "." + DBAttributes.ARTIST_ID
				+ " = " + DBTables.Song + "." + DBAttributes.ARTIST_ID 
				+ " AND " + DBTables.Song + "."	+ DBAttributes.SONG_ID + " = " + songId;
		return getAllInfo(get);
	}

	/**
	 * 
	 * @param playlistId
	 *            : ID of playlist to search for its content
	 * @return Returns a JSONArray with a JSONOBject per song in the playlist.
	 *         The JSONObject contains the all information of the songs in the
	 *         playlist including sources, albums and tags.
	 */

	private JSONArray getPlaylist(int playlistId) {
		String get = "SELECT " + DBTables.PlaylistEntry + ".*, " + DBTables.Song + "." + DBAttributes.TITLE + ", "
				+ DBTables.Artist + "." + DBAttributes.ARTIST_NAME 
				+ " FROM " + DBTables.PlaylistEntry + ", " + DBTables.Song + ", " + DBTables.Artist 
				+ " WHERE " + DBAttributes.PLAYLIST_ID + " = " + playlistId
				+ " AND " + DBTables.Song + "." + DBAttributes.SONG_ID + " = " + DBTables.PlaylistEntry + "."
				+ DBAttributes.SONG_ID 
				+ " AND " + DBTables.Song + "." + DBAttributes.ARTIST_ID + " = "
				+ DBTables.Artist + "." + DBAttributes.ARTIST_ID;
		return getAllInfo(get);
	}

	/**
	 * Gets all playlists in the database.
	 * 
	 * @return A JSONArray of every playlists name, ID, the time it was last
	 *         changed and the number of songs in it
	 */

	private JSONArray getPlaylists() {
		String get = "SELECT * FROM " + DBTables.Playlist;
		JSONArray playlists = query(get);
		
		for (int i = 0; i < playlists.length(); i++) {
			playlists.getJSONObject(i).put("entries",
					getPlaylist(playlists.getJSONObject(i).getInt(DBAttributes.PLAYLIST_ID)).length());
		}
		return playlists;
	}

	/**
	 * Adds a song to the Database. The method checks for the sent information
	 * inside the given JSONObject and inserts the information into the specific
	 * tables.
	 * 
	 * @param song
	 *            : JSONObject with all information of a song, that should be
	 *            added. TYPE, TITLE and VALUE have to be in the JSONObject,
	 *            other information can be added.
	 */

	private void addSong(JSONObject song) {
		String insert;
		int songId;
		int albumId;
		int artistId;
		String year = "0";
		String type = turnToSqlString(song.getString(DBAttributes.TYPE));
		String title = turnToSqlString(song.getString(DBAttributes.TITLE));

		String value = turnToSqlString(song.getString(DBAttributes.VALUE));
		String album = "";
		String artist = "";
		String tag = "";
		ResultSet rs;
		if (song.has(DBAttributes.YEAR) && !song.isNull(DBAttributes.YEAR)) {
			year = turnToSqlString(song.getString(DBAttributes.YEAR));
		}
		if (song.has(DBAttributes.ALBUM_NAME) && !song.isNull(DBAttributes.ALBUM_NAME)) {
			album = turnToSqlString(song.getString(DBAttributes.ALBUM_NAME));
		}
		if (song.has(DBAttributes.ARTIST_NAME) && !song.isNull(DBAttributes.ARTIST_NAME)) {
			artist = turnToSqlString(song.getString(DBAttributes.ARTIST_NAME));
		}
		if (song.has(DBAttributes.TAG_NAME) && !song.isNull(DBAttributes.TAG_NAME)) {
			tag = turnToSqlString(song.getString(DBAttributes.TAG_NAME));
		}

		try {
			statement = databaseConnection.createStatement();
			JSONArray information;
			insert = "SELECT " + DBAttributes.ARTIST_ID + " FROM " + DBTables.Artist 
					+ " WHERE " + DBAttributes.ARTIST_NAME + " = '" + artist + "'";
			information = query(insert);

			if (information.isNull(0)) {
				insert = "INSERT INTO " + DBTables.Artist + " (" + DBAttributes.ARTIST_NAME + ")" 
						+ "VALUES ('" + artist + "')";
				statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
				rs = statement.getGeneratedKeys();
				rs.next();
				artistId = rs.getInt(1);
			} else {
				artistId = information.getJSONObject(0).getInt(DBAttributes.ARTIST_ID);
			}
			insert = "SELECT " + DBAttributes.SONG_ID + " FROM " + DBTables.Song + " WHERE " + DBAttributes.TITLE
					+ " LIKE '" + title + "'" + " AND " + DBAttributes.ARTIST_ID + " = " + artistId;
			information = query(insert);

			if (information.isNull(0)) {
				insert = "INSERT INTO " + DBTables.Song + " (" + DBAttributes.ARTIST_ID + "," + DBAttributes.YEAR + ","
						+ DBAttributes.TITLE + ")" + "VALUES (" + artistId + ", " + year + ", '" + title + "')";
				statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
				rs = statement.getGeneratedKeys();
				rs.next();
				songId = rs.getInt(1);
			} else {
				songId = information.getJSONObject(0).getInt(DBAttributes.SONG_ID);
			}

			insert = "SELECT " + DBAttributes.SOURCE_ID + " FROM " + DBTables.Source + " WHERE " + DBAttributes.SONG_ID
					+ " LIKE " + songId;
			information = query(insert);
			if (information.isNull(0)) {
				insert = "INSERT INTO " + DBTables.Source + " (" + DBAttributes.SONG_ID + "," + DBAttributes.TYPE + ","
						+ DBAttributes.VALUE + ")" + "VALUES (" + songId + ", '" + type + "', '" + value + "')";
				statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
			}

			insert = "SELECT " + DBAttributes.ALBUM_ID + " FROM " + DBTables.Album + " WHERE " + DBAttributes.ALBUM_NAME
					+ " LIKE '" + album + "'";
			information = query(insert);
			if (information.isNull(0)) {
				if (album == "") {
					insert = "INSERT INTO " + DBTables.Album + " (" + DBAttributes.ALBUM_NAME + ", "
							+ DBAttributes.ARTIST_ID + ")" + "VALUES ('" + album + "', " + 0 + ")";
					statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
					rs = statement.getGeneratedKeys();
					rs.next();
					albumId = rs.getInt(1);
				} else {
					insert = "INSERT INTO " + DBTables.Album + " (" + DBAttributes.ALBUM_NAME + ", "
							+ DBAttributes.ARTIST_ID + ")" + "VALUES ('" + album + "', " + artistId + ")";
					statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
					rs = statement.getGeneratedKeys();
					rs.next();
					albumId = rs.getInt(1);
				}
			} else {
				albumId = information.getJSONObject(0).getInt(DBAttributes.ALBUM_ID);
			}

			insert = "SELECT * FROM " + DBTables.Tag + " WHERE " + DBAttributes.SONG_ID + " = " + songId;
			information = query(insert);
			if (information.isNull(0)) {
				insert = "INSERT INTO " + DBTables.Tag + " (" + DBAttributes.TAG_NAME + "," + DBAttributes.SONG_ID + ")"
						+ "VALUES ('" + tag + "'," + songId + ")";
				statement.executeUpdate(insert);
			}

			insert = "SELECT * FROM " + DBTables.AlbumEntry + " WHERE " + DBAttributes.ALBUM_ID + " = " + albumId
					+ " AND " + DBAttributes.SONG_ID + " = " + songId;
			information = query(insert);
			if (information.isNull(0)) {
				insert = "INSERT INTO " + DBTables.AlbumEntry + " (" + DBAttributes.ALBUM_ID + ","
						+ DBAttributes.SONG_ID + ")" + "VALUES (" + albumId + ", " + songId + ")";
				statement.executeUpdate(insert);
			}
			logger.info("New information was added to tables.");

		} catch (SQLException e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} catch (Exception e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} finally {
			try {
				if (statement != null) {
					statement.close();
				}
			} catch (SQLException e) {
				ExceptionHandler.showErrorDialog(e);
				logger.error("", e);
			}
		}
	}

	/**
	 * Adds a new playlist to the table playlist and returns its generated Id.
	 * 
	 * @param name
	 *            : Name of the new playlist.
	 * @return Generated playlist ID.
	 */

	private int addPlaylist(String name) {
		Timestamp stamp = new Timestamp(System.currentTimeMillis());
		String insert = "INSERT INTO " + DBTables.Playlist + " (" + DBAttributes.NAME + ", " + DBAttributes.TIMESTAMP
				+ ")" + " VALUES ('" + turnToSqlString(name) + "', '" + stamp.toString() + "')";
		int playlistId = 0;
		ResultSet rs;
		try {
			statement = databaseConnection.createStatement();
			statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
			rs = statement.getGeneratedKeys();
			rs.next();
			playlistId = rs.getInt(1);
		} catch (SQLException e) {
			logger.error("Problem with Statement...");
			e.printStackTrace();
		} catch (Exception e) {
			logger.error(e.getMessage().toString());
		}
		return playlistId;
	}

	/**
	 * Adds a song to a playlist. The tracknumber can be higher than the highest
	 * tracknumber in the playlist. The method automatically changes the
	 * tracknumber to the right value. Songs that follow after the entered
	 * tracknumber will automatically get placed one number higher.
	 * 
	 * @param songId
	 *            : ID of song to be added.
	 * @param playlistId
	 *            : ID of playlist, in which the song should be added.
	 * @param trackNumber
	 *            : Tracknumber on which position in the playlist the song
	 *            should be added.
	 */

	private void addSongToPlaylist(int songId, int playlistId, int trackNumber) {
		Timestamp stamp = new Timestamp(System.currentTimeMillis());
		JSONArray information = getSong(songId);
		String insert;
		insert = "SELECT MAX(" + DBAttributes.NR + ") AS MAX FROM " + DBTables.PlaylistEntry + " WHERE "
				+ DBAttributes.PLAYLIST_ID + " = " + playlistId;
		information = query(insert);
		if (information.getJSONObject(0).has("max")) {
			trackNumber = information.getJSONObject(0).getInt("max") + 1;
		} else {
			trackNumber = 1;
		}
		System.out.println(trackNumber);
		insert = "SELECT " + DBAttributes.NR + ", " + DBAttributes.SONG_ID + " FROM " + DBTables.PlaylistEntry
				+ " WHERE " + DBAttributes.PLAYLIST_ID + " = " + playlistId + " AND " + DBAttributes.NR + " > "
				+ trackNumber;
		information = query(insert);
		try {
			for (int i = 0; i < information.length(); i++) {
				insert = "UPDATE " + DBTables.PlaylistEntry + " SET " + DBAttributes.NR + " = "
						+ (information.getJSONObject(i).getInt(DBAttributes.NR) + 1) + " WHERE "
						+ DBAttributes.PLAYLIST_ID + " = " + playlistId + " AND " + DBAttributes.SONG_ID + " = "
						+ information.getJSONObject(i).getInt(DBAttributes.SONG_ID);
				statement = databaseConnection.createStatement();
				statement.executeUpdate(insert);
			}
			insert = "INSERT INTO " + DBTables.PlaylistEntry + " (" + DBAttributes.PLAYLIST_ID + ", "
					+ DBAttributes.SONG_ID + ", " + DBAttributes.NR + ")" 
					+ "VALUES ('" + playlistId + "', " + songId	+ ", " + trackNumber + ")";
			statement = databaseConnection.createStatement();
			statement.executeUpdate(insert);
			insert = "UPDATE " + DBTables.Playlist + " SET " + DBAttributes.TIMESTAMP + " = '" + stamp.toString()
					+ "' WHERE " + DBAttributes.PLAYLIST_ID + " = " + playlistId;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(insert);
			logger.info("Song added to playlist.");
		} catch (SQLException e) {
			logger.error("Problem with Statement...");
			e.printStackTrace();
		} catch (Exception e) {
			logger.error(e.getMessage().toString());
		}

	}

	/**
	 * Checks if the tables for the FlowMusic database exist and creates them if
	 * necessary.
	 */

	private void addAllTables() {
		try {
			String table = "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE table_schema ='PUBLIC'";
			if (query(table).isNull(0)) {
				table = "CREATE TABLE " + DBTables.Playlist + "( " + DBAttributes.PLAYLIST_ID
						+ " int NOT NULL AUTO_INCREMENT, " + DBAttributes.NAME + " varchar(255) NOT NULL, "
						+ DBAttributes.TIMESTAMP + " varchar(255), " 
						+ "PRIMARY KEY(" + DBTables.PLAYLIST_ID + "))";
				statement = databaseConnection.createStatement();
				statement.executeUpdate(table);

				table = "CREATE TABLE " + DBTables.PlaylistEntry + "( " + DBAttributes.PLAYLIST_ID
						+ " int NOT NULL AUTO_INCREMENT, " + DBAttributes.SONG_ID + " int NOT NULL, " + DBAttributes.NR
						+ " int(4), " + "PRIMARY KEY (" + DBAttributes.PLAYLIST_ID + ", " + DBAttributes.NR + "))";
				statement.executeUpdate(table);

				table = "CREATE TABLE " + DBTables.Artist + "( " + DBAttributes.ARTIST_ID
						+ " int NOT NULL AUTO_INCREMENT, " + DBAttributes.ARTIST_NAME + " varchar(255), "
						+ "PRIMARY KEY (" + DBAttributes.ARTIST_ID + "))";
				statement.executeUpdate(table);

				table = "CREATE TABLE " + DBTables.Song + "( " + DBAttributes.SONG_ID + " int NOT NULL AUTO_INCREMENT, "
						+ DBAttributes.ARTIST_ID + " int NOT NULL, " + DBAttributes.YEAR + " int(4), "
						+ DBAttributes.TITLE + " varchar(255), " + "PRIMARY KEY (" + DBAttributes.SONG_ID + "))";
				statement.executeUpdate(table);

				table = "CREATE TABLE " + DBTables.Album + "(" + DBAttributes.ALBUM_ID
						+ " int NOT NULL AUTO_INCREMENT, " + DBTables.ALBUM_NAME + " varchar(255), "
						+ DBTables.ARTIST_ID + " int NOT NULL ," + "PRIMARY KEY (" + DBAttributes.ALBUM_ID + "))";
				statement.executeUpdate(table);

				table = "CREATE TABLE " + DBTables.AlbumEntry + "(" + DBAttributes.ALBUM_ID + " int NOT NULL, "
						+ DBAttributes.SONG_ID + " int NOT NULL)";
				statement.executeUpdate(table);

				table = "CREATE TABLE " + DBTables.Source + "(" + DBAttributes.SOURCE_ID
						+ " int NOT NULL AUTO_INCREMENT, " + DBAttributes.SONG_ID + " int NOT NULL, "
						+ DBAttributes.TYPE + " varchar(255), " + DBAttributes.VALUE + " varchar(255), "
						+ "PRIMARY KEY (" + DBAttributes.SOURCE_ID + "))";
				statement.executeUpdate(table);

				table = "CREATE TABLE " + DBTables.Tag + "(" + DBAttributes.TAG_NAME + " varchar(255), "
						+ DBAttributes.SONG_ID + " int NOT NULL)";
				statement.executeUpdate(table);
				logger.info("All tables sucessfully created...");
			} else {
				logger.info("Tables do allready exist...");
			}

		} catch (SQLException e) {
			logger.info("Error when trying to start...");
		} catch (Exception e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} finally {
			try {
				if (statement != null) {
					statement.close();
				}
			} catch (SQLException e) {
				ExceptionHandler.showErrorDialog(e);
				logger.error("", e);
			}
		}
	}

	/**
	 * Drops all tables of the FlowMusic database. Only method not used yet in
	 * Database class. Can be used if tables change their attributes, to make a
	 * "reset" of the database. Could be added in later versions of the program
	 * to give users possibility of a reset.
	 */

	private void dropAllTables() {
		String drop;
		try {
			drop = "DROP TABLE " + DBTables.Playlist;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(drop);

			drop = "DROP TABLE " + DBTables.PlaylistEntry;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(drop);

			drop = "DROP TABLE " + DBTables.Artist;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(drop);

			drop = "DROP TABLE " + DBTables.Song;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(drop);

			drop = "DROP TABLE " + DBTables.Album;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(drop);

			drop = "DROP TABLE " + DBTables.AlbumEntry;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(drop);

			drop = "DROP TABLE " + DBTables.Source;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(drop);

			drop = "DROP TABLE " + DBTables.Tag;
			statement = databaseConnection.createStatement();
			statement.executeUpdate(drop);
			logger.info("All tables droped...");
		} catch (SQLException e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} catch (Exception e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} finally {
			try {
				if (statement != null) {
					statement.close();
				}
			} catch (SQLException e) {
				ExceptionHandler.showErrorDialog(e);
				logger.error("", e);
			}
		}
	}

	/**
	 * SQL has problems with Strings containing " ' ". The method converts
	 * Strings to suit SQL by adding another " ' " to the String which prevents
	 * SQL-Exceptions from occuring.
	 * 
	 * @param string
	 * @return
	 */

	private String turnToSqlString(String string) {
		return string.replaceAll("'", "''");
	}

}
