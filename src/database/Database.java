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

			// TODO: create Database if empty
			statement = databaseConnection.createStatement();
			statement.executeUpdate("CREATE DATABASE FLOWMUSIC");
			//
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
			}
		}

		// Table creation:
		try {//TODO test if more statements in a row without closing works
			String table = "CREATE TABLE playlists " + 
							"( playlistId int NOT NULL AUTO_INCREMENT, "+
							"playlistname varchar(255) NOT NULL, " + 
							"PRIMARY KEY(playlistId))";
			statement.getConnection().createStatement();
			statement.executeUpdate(table);
			
			table = "CREATE TABLE playlistentry "+
					"( playlistId int NOT NULL AUTO_INCREMENT, "+
					"songId int NOT NULL, "+
					"nr int(4), "+
					"PRIMARY KEY (playlistId, songId))";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE artist "+
					"( artistId int NOT NULL AUTO_INCREMENT, "+
					"artist varchar(255), "+
					"PRIMARY KEY (artistId))";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE songs "+
					"( songId int NOT NULL AUTO_INCREMENT, "+
					"artistId int NOT NULL, "+
					"year int(4), "+
					"title varchar(255), "+
					"PRIMARY KEY (songId))";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE album "+
					"(albumId int NOT NULL AUTO_INCREMENT, "+
					"albumname varchar(255), "+
					"PRIMARY KEY (albumId))";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE albumentry "+
					"(albumId int NOT NULL, "+
					"songId int NOT NULL)";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE source "+
					"(sourceId int NOT NULL AUTO_INCREMENT, "+
					"songId int NOT NULL, "+
					"type varchar(255), "+
					"value varchar(255), "+
					"PRIMARY KEY (sourceId))";
			statement.executeUpdate(table);
			
			table = "CREATE TABLE tag "+
					"(tagname varchar(255), "+
					"songId int NOT NULL)";
			statement.executeUpdate(table);
		} catch (SQLException e) {
		}catch(Exception e){
		}finally{
			try {
				if (statement != null) {
					statement.close();
				}
			} catch (SQLException e) {
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
		} catch (Exception e){
		}finally{
			try {
				if (statement != null) {
					statement.close();
				}
			} catch (SQLException e) {
			}
		}
	}

}
