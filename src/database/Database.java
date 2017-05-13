package database;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;

import org.json.JSONArray;
import org.json.JSONObject;

import central.Central;
import central.Component;
import central.ExceptionHandler;
import central.ThreadedComponent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Database extends ThreadedComponent {
	Connection databaseConnection;
	Statement statement;
	private static final Logger logger = LoggerFactory.getLogger(Database.class);

	public Database(Central central, File folder) {
		super(Component.DATABASE, central);

		// DataBase creation:
		try {
			// Save the database at the user home directory, subdirectory
			// .Flowmusic
			String dbName = "~/.FlowMusic/data";
			// or, if specified, use this instead
		if(folder != null && folder.getParentFile().exists()){
				dbName = folder.getAbsolutePath();
			}
 
			Class.forName("org.h2.Driver");
			databaseConnection = DriverManager.getConnection("jdbc:h2:"+dbName);
			
		} catch (ClassNotFoundException e) { 
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} catch (SQLException e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} finally {// TODO test
			try {
				if (statement != null) {
					statement.close();
				}
			} catch (SQLException e) {
				ExceptionHandler.showErrorDialog(e);
				logger.error("", e);
			}
		}

		// Table creation:
		try {//TODO test if more statements in a row without closing works
			String table = "CREATE TABLE "+DBTables.Playlist + 
							"( "+DBAttributes.PLAYLIST_ID+" int NOT NULL AUTO_INCREMENT, "+
							DBAttributes.NAME+" varchar(255) NOT NULL, " + 
							"PRIMARY KEY("+DBTables.PLAYLIST_ID+"))";
			statement= databaseConnection.createStatement();
			statement.executeUpdate(table);
			
			table = "CREATE TABLE "+DBTables.PlaylistEntry+
					"( "+DBAttributes.PLAYLIST_ID+" int NOT NULL AUTO_INCREMENT, "+
					DBAttributes.SONG_ID+" int NOT NULL, "+
					DBAttributes.NR+" int(4), "+
					"PRIMARY KEY ("+DBAttributes.PLAYLIST_ID+", "+DBAttributes.SONG_ID+"))";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE "+DBTables.Artist+
					"( "+DBAttributes.ARTIST_ID+" int NOT NULL AUTO_INCREMENT, "+
					DBAttributes.NAME+" varchar(255), "+
					"PRIMARY KEY ("+DBAttributes.ARTIST_ID+"))";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE "+DBTables.Song +
					"( "+DBAttributes.SONG_ID+" int NOT NULL AUTO_INCREMENT, "+
					DBAttributes.ARTIST_ID+" int NOT NULL, "+
					DBAttributes.YEAR+" int(4), "+
					DBAttributes.TITLE+" varchar(255), "+
					"PRIMARY KEY ("+DBAttributes.SONG_ID+"))";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE "+DBTables.Album+
					"("+DBAttributes.ALBUM_ID+" int NOT NULL AUTO_INCREMENT, "+
					DBTables.NAME+" varchar(255), "+
					"PRIMARY KEY ("+DBAttributes.ALBUM_ID+"))";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE "+DBTables.AlbumEntry+
					"("+DBAttributes.ALBUM_ID+" int NOT NULL, "+
					DBAttributes.SONG_ID+" int NOT NULL)";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE "+DBTables.Source+
					"("+DBAttributes.ID+" int NOT NULL AUTO_INCREMENT, "+
					DBAttributes.SONG_ID+" int NOT NULL, "+
					DBAttributes.TYPE+" varchar(255), "+
					DBAttributes.VALUE+" varchar(255), "+
					"PRIMARY KEY ("+DBAttributes.ID+"))";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE "+DBTables.Tag+
					"("+DBAttributes.NAME+" varchar(255), "+
					DBAttributes.SONG_ID+" int NOT NULL)";
			statement.executeUpdate(table);
		} catch (SQLException e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		}catch(Exception e){
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		}finally{
			try {
				if (statement != null) {
					statement.close();
				}
			} catch (SQLException e) {
				ExceptionHandler.showErrorDialog(e);
				logger.error("", e);
			}
			
			//Adding information from Crawler to DB
			
		}
		
		
	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg) throws Exception {
		String command = msg.getString("command");
		switch (command) {
		case "get":

			// TODO: further selection, filtering, joining, ...
			// For debugging purposes and until the database works, we return a
			// fixed value:
			JSONObject ret = new JSONObject();
			JSONArray found = new JSONArray();
			JSONObject song = new JSONObject();
			/*
			 *  artist: "Martin Garrix & Bebe Rexha",
		        title: "In the Name of Love",
		        sources: [{
		            plugin: "local",
		            source: "test3.mp3"
		        }]
			 */
			song.put("artist", "Martin Garrix & Bebe Rexha");
			song.put("title", "In the Name of Love");
			JSONArray sources = new JSONArray();
			sources.put(new JSONObject("{\"plugin\": \"local\", \"source\":\"test.mp3\"}"));
			song.put("sources", sources);
			found.put(song);
			ret.put("answer", found);
	/*		JSONArray res = query("SELECT * FROM songs");
			JSONObject ret = new JSONObject();
			ret.put("answer", res);*/
			return ret;

		case "...":
			// TODO: other messages
			break;

		default:
			// TODO: error
		}
		return null;
	}
	
	private JSONArray query(String query){
		JSONArray result = new JSONArray();
		try{
			Statement stmt = databaseConnection.createStatement();
			ResultSet rs = stmt.executeQuery(query);
			ResultSetMetaData meta = rs.getMetaData();
			while(rs.next()){
				JSONObject line = new JSONObject();
				
				for(int i = 0; i < meta.getColumnCount(); i++){
					Object obj = rs.getObject(i);
					String columnName = meta.getColumnName(i);
					if(obj instanceof String){
						line.put(columnName, (String) obj);
					}else{
						// TODO
					}
				}
				result.put(line);
			}
		}catch(SQLException e){
			ExceptionHandler.showErrorDialog(e);
            logger.error("", e);
		}

		return result;
	}
	
	//TODO
	private void addSong(){//unknown source type
		String insert;
		int songId;
		int sourceId;
		int albumId;
		int artistId;
		String year = null;
		String title = null;
		String type = null;
		String value = null;
		String album = null;
		String artist = null;
		String tag = null;
		
		try {
			statement.getConnection().createStatement();
			
			insert = "INSERT INTO artist (artist)"+
					"VALUES ("+artist+")";
			artistId = statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
			
			insert = "INSERT INTO songs (year, title)"+
					"VALUES ("+artistId+", "+ year+", "+ title+")";
			songId = statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
			
			insert = "INSERT INTO source (type, value)"+
					"VALUES ("+songId+", "+type+", "+ value+")";
			sourceId = statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
			
			insert = "INSERT INTO album (albumname)"+
					"VALUES ("+album+")";
			albumId = statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
			
			insert = "INSERT INTO tag (tagname, songId)"+
					"VALUES ("+songId+", "+tag+")";
			statement.executeUpdate(insert);
			
			insert = "INSERT INTO albumentry (albumId, songId)"+
					"VALUES ("+albumId+", "+songId+")";
		} catch (SQLException e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} catch (Exception e){
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		}finally{
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

}
