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
import ch.qos.logback.core.net.SyslogOutputStream;

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

		// Table creation:
		addAllTables();
	
		
		//Adding information from Crawler to DB
		
		//DB test and information
		
		
		
		
		//Drop Tables
		
	
		
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
				
				for(int i = 1; i <= meta.getColumnCount(); i++){
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
	
	private void addSong(JSONObject song){
		String insert;
		
		int songId;
		int sourceId;
		int albumId;
		int artistId;
		String year = "";
		String type = "";
		String title = song.getString(DBAttributes.TITLE);;
		String value = "";
		String album = "";
		String artist = "";
		String tag = "";
		if(song.getString(DBAttributes.YEAR)!=null){
			year = song.getString(DBAttributes.YEAR);
		}
		if(song.getString(DBAttributes.TYPE)!=null){
			type = song.getString(DBAttributes.TYPE);
		}
		if(song.getString(DBAttributes.VALUE)!=null){
			value = song.getString(DBAttributes.VALUE);
		}
		if(song.getString(DBAttributes.ALBUM_NAME)!=null){
			album = song.getString(DBAttributes.ALBUM_NAME);
		}
		if(song.getString(DBAttributes.ARTIST_NAME)!=null){
			artist = song.getString(DBAttributes.ARTIST_NAME);
		}
		if(song.getString(DBAttributes.TAG_NAME)!=null){
			tag = song.getString(DBAttributes.TAG_NAME);
		}
		

		try {
			statement= databaseConnection.createStatement();
			
			//TODO
			//better request for song existence needed
			
			insert= "SELECT "+DBAttributes.TITLE+" FROM "+DBTables.Song+" WHERE "+DBAttributes.TITLE+" LIKE '"+title+"'";
			JSONArray information=query(insert);
		
			if(information.isNull(0)){
				insert= "SELECT "+DBAttributes.ARTIST_NAME+" FROM "+DBTables.Artist+" WHERE "+DBAttributes.ARTIST_NAME+" LIKE '"+artist+"'";
				information=query(insert);
				if(information.isNull(0)){
					insert = "INSERT INTO "+DBTables.Artist+" ("+DBAttributes.ARTIST_NAME+")"+
							"VALUES ('"+artist+"')";
					artistId = statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
				}else{
					artistId = information.getInt(0);
				}
				
				insert = "INSERT INTO "+DBTables.Song+" ("+DBAttributes.ARTIST_ID+","+DBAttributes.YEAR+","+DBAttributes.TITLE+")"+
						"VALUES ("+artistId+", "+ year+", '"+ title+"')";
				songId = statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
				
				insert = "INSERT INTO "+DBTables.Source+" ("+DBAttributes.SONG_ID+","+DBAttributes.TYPE+","+DBAttributes.VALUE+")"+
						"VALUES ("+songId+", '"+type+"', '"+ value+"')";
				sourceId = statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
				
				insert= "SELECT "+DBAttributes.ALBUM_NAME+" FROM "+DBTables.Album+" WHERE "+DBAttributes.ALBUM_NAME+" LIKE '"+album+"'";
				information=query(insert);
				if(information.isNull(0)){
					insert = "INSERT INTO "+DBTables.Album+" ("+DBAttributes.ALBUM_NAME+")"+
							"VALUES ('"+album+"')";
					albumId = statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
				}else{
					albumId = information.getInt(0);
				}

				insert = "INSERT INTO "+DBTables.Tag+" ("+DBAttributes.TAG_NAME+","+DBAttributes.SONG_ID+")"+
						"VALUES ('"+tag+"',"+songId+")";
				statement.executeUpdate(insert);
				
				insert = "INSERT INTO "+DBTables.AlbumEntry+" ("+DBAttributes.ALBUM_ID+","+DBAttributes.SONG_ID+")"+
						"VALUES ("+albumId+", "+songId+")";
				logger.info("Song "+title+" was added to tables.");
			}else{
				logger.info("Song "+title+" is already in the tables.");
			}
			
		
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
	
	private void addPlaylist(){//TODO
		
	}
	
	private void addSongToPlaylist(){//TODO
		
	}
	
	private JSONArray getPlaylists(){//TODO
		return null;
	}
	
	private JSONArray getSongs(){//TODO
		return null;
	}
	
	private JSONArray getSong(int ID){//TODO
		String get="SELECT "+DBAttributes.TITLE+" FROM "+DBTables.Song+" WHERE "+DBAttributes.TITLE+" LIKE 'Alle meine Tests'";
		return null;
	}
	
	private void addAllTables(){
		try {
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
					DBAttributes.ARTIST_NAME+" varchar(255), "+
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
					DBTables.ALBUM_NAME+" varchar(255), "+
					"PRIMARY KEY ("+DBAttributes.ALBUM_ID+"))";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE "+DBTables.AlbumEntry+
					"("+DBAttributes.ALBUM_ID+" int NOT NULL, "+
					DBAttributes.SONG_ID+" int NOT NULL)";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE "+DBTables.Source+
					"("+DBAttributes.SOURCE_ID+" int NOT NULL AUTO_INCREMENT, "+
					DBAttributes.SONG_ID+" int NOT NULL, "+
					DBAttributes.TYPE+" varchar(255), "+
					DBAttributes.VALUE+" varchar(255), "+
					"PRIMARY KEY ("+DBAttributes.SOURCE_ID+"))";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE "+DBTables.Tag+
					"("+DBAttributes.TAG_NAME+" varchar(255), "+
					DBAttributes.SONG_ID+" int NOT NULL)";
			statement.executeUpdate(table);
			logger.info("All tables sucessfully created...");
		} catch (SQLException e) {
			logger.info("Tables found...");
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
		}
	}
	
	private void dropAllTables(){
		String drop;
		try {
			drop="DROP TABLE "+DBTables.Playlist;
			statement= databaseConnection.createStatement();
			statement.executeUpdate(drop);
			
			drop="DROP TABLE "+DBTables.PlaylistEntry;
			statement= databaseConnection.createStatement();
			statement.executeUpdate(drop);
			
			drop="DROP TABLE "+DBTables.Artist;
			statement= databaseConnection.createStatement();
			statement.executeUpdate(drop);
			
			drop="DROP TABLE "+DBTables.Song;
			statement= databaseConnection.createStatement();
			statement.executeUpdate(drop);
			
			drop="DROP TABLE "+DBTables.Album;
			statement= databaseConnection.createStatement();
			statement.executeUpdate(drop);
			
			drop="DROP TABLE "+DBTables.AlbumEntry;
			statement= databaseConnection.createStatement();
			statement.executeUpdate(drop);
			
			drop="DROP TABLE "+DBTables.Source;
			statement= databaseConnection.createStatement();
			statement.executeUpdate(drop);
			
			drop="DROP TABLE "+DBTables.Tag;
			statement= databaseConnection.createStatement();
			statement.executeUpdate(drop);
			logger.info("All tables droped...");
		} catch (SQLException e) {
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} catch (Exception e){
			ExceptionHandler.showErrorDialog(e);
			logger.error("", e);
		} finally{
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
