package database;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;

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
	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg) throws Exception {
		String command = msg.getString("command");
		
		
		switch (command) {
		
		case "start":
			addAllTables();
			
			break;
		case "get":

			
			// TODO: further selection, filtering, joining, ...
//			String what = msg.getString("what");
//			String filter="";
//			String criteria = "";
//			if(msg.get("filter") instanceof JSONObject){//check if there is a JSONObject with a criteria
//				JSONObject obj=(JSONObject) msg.get("filter");
//				DBTables[] tables=DBTables.values();
//				for(int i=0; i<tables.length; i++){//check in the filter for the attribute
//					for(int j=0; j<tables[i].getAttributes().size();j++){
//						filter=obj.optString(tables[i].getAttributes().get(j), filter);
//					}
//				}
//				criteria=obj.getString(filter);
//			}else{
//				filter = msg.get("filter").toString();
//			}
			JSONObject ret = new JSONObject();
			JSONArray found = new JSONArray();
			JSONObject song = new JSONObject();
		
			found = getAllSongInformation();
			ret.put("found", found);
			//TODO
			
			
			ret.put("answer", found);
	/*		JSONArray res = query("SELECT * FROM songs");
			JSONObject ret = new JSONObject();
			ret.put("answer", res);*/
			

			
//			switch(what){
//			case "allSongs":
//				found = getAllSongInformation();
//				break;
//			default:
//				switch(filter){	//TODO: 
//				case "*":
//					found = getAllEntrys(what);
//					break;
//				case DBAttributes.ALBUM_ID:
//					found = getInfoAlbumId(what, criteria);
//					break;
//				
//				case DBAttributes.SONG_ID:
//					found = getSong(what, criteria);
//					break;
//				}
//				break;
//				
//			}
			return ret;
		case "update"://TODO
			break;
		case "insertSong"://TODO
			JSONObject newSong = new JSONObject();
			newSong.put(DBAttributes.TITLE,msg.get(DBAttributes.TITLE));
			newSong.put(DBAttributes.TYPE, msg.getJSONArray("sources").getJSONObject(0).get(DBAttributes.TYPE));
			newSong.put(DBAttributes.VALUE, msg.getJSONArray("sources").getJSONObject(0).get(DBAttributes.VALUE));
			if(msg.has(DBAttributes.ARTIST_NAME)){
				newSong.put(DBAttributes.ARTIST_NAME, msg.get(DBAttributes.ARTIST_NAME));
			}
			if(msg.has(DBAttributes.YEAR)){
				newSong.put(DBAttributes.YEAR, msg.get(DBAttributes.YEAR));
			}
			if(msg.has(DBAttributes.ALBUM_NAME)){
				newSong.put(DBAttributes.ALBUM_NAME, msg.get(DBAttributes.ALBUM_NAME));
			}
			if(msg.has(DBAttributes.TAG_NAME)){
				newSong.put(DBAttributes.TAG_NAME, msg.get(DBAttributes.TAG_NAME));
			}
			addSong(newSong);
			break;
		case "delete"://TODO
			switch(command){
			case "playlist":
			case "playlistentry":
			}
			break;
			
		default:
			

		
			// TODO: error
		}
		
		return null;
	}

	
	

	private JSONArray getInfoAlbumId(String table, String criteria) {
		// TODO test
		String get = "SELECT "+table+".*" +
				"FROM "+DBTables.Song+", "+DBTables.Artist+", "+DBTables.Album+", "+DBTables.Tag+", "+DBTables.Source+
				" WHERE "+DBTables.Album+"."+DBAttributes.ALBUM_ID+" = "+criteria+
				" AND "+DBTables.Artist+"."+DBAttributes.ARTIST_ID+" = "+DBTables.Song+"."+DBAttributes.ARTIST_ID+
				" AND "+DBTables.Source+"."+DBAttributes.SONG_ID+" = "+DBTables.Song+"."+DBAttributes.SONG_ID;
		return query(get);
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
						line.put(columnName.toLowerCase(), (String) obj);
					}else if(obj instanceof Integer){
						line.put(columnName.toLowerCase(), (Integer) obj);
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
		String year = "0";
		String type = song.getString(DBAttributes.TYPE);
		String title = song.getString(DBAttributes.TITLE);
		String value = song.getString(DBAttributes.VALUE);
		String album = "";
		String artist = "";
		String tag = "";
		ResultSet rs;
		if(song.has(DBAttributes.YEAR) && !song.isNull(DBAttributes.YEAR)){
			year = song.getString(DBAttributes.YEAR);
		}
		if(song.has(DBAttributes.ALBUM_NAME) && !song.isNull(DBAttributes.ALBUM_NAME)){
			album = song.getString(DBAttributes.ALBUM_NAME);
		}
		if(song.has(DBAttributes.ARTIST_NAME) && !song.isNull(DBAttributes.ARTIST_NAME)){
			artist = song.getString(DBAttributes.ARTIST_NAME);
		}
		if(song.has(DBAttributes.TAG_NAME) && !song.isNull(DBAttributes.TAG_NAME)){
			tag = song.getString(DBAttributes.TAG_NAME);
		}

		try {
			statement= databaseConnection.createStatement();
			
			//TODO
			//better request for song existence needed
			
			insert= "SELECT "+DBAttributes.TITLE+" FROM "+DBTables.Song+" WHERE "+DBAttributes.TITLE+" LIKE '"+title+"'";
			JSONArray information=query(insert);

			if(information.isNull(0)){
				insert= "SELECT "+DBAttributes.ARTIST_ID+" FROM "+DBTables.Artist+" WHERE "+DBAttributes.ARTIST_NAME+" = '"+artist+"'";
				information=query(insert);
				if(information.isNull(0)){
					insert = "INSERT INTO "+DBTables.Artist+" ("+DBAttributes.ARTIST_NAME+")"+
							"VALUES ('"+artist+"')";
					statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
					rs=statement.getGeneratedKeys();
					rs.next();
					artistId=rs.getInt(1);
				}else{
					artistId = information.getJSONObject(0).getInt(DBAttributes.ARTIST_ID);
				}

				insert = "INSERT INTO "+DBTables.Song+" ("+DBAttributes.ARTIST_ID+","+DBAttributes.YEAR+","+DBAttributes.TITLE+")"+
						"VALUES ("+artistId+", "+ year+", '"+ title+"')";
				//TODO
				statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
				rs=statement.getGeneratedKeys();
				rs.next();
				songId=rs.getInt(1);
				
				insert = "INSERT INTO "+DBTables.Source+" ("+DBAttributes.SONG_ID+","+DBAttributes.TYPE+","+DBAttributes.VALUE+")"+
						"VALUES ("+songId+", '"+type+"', '"+ value+"')";
				sourceId = statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
				
				insert= "SELECT "+DBAttributes.ALBUM_ID+" FROM "+DBTables.Album+" WHERE "+DBAttributes.ALBUM_NAME+" LIKE '"+album+"'";
				information=query(insert);
				if(information.isNull(0)){
					if(album==""){
						insert = "INSERT INTO "+DBTables.Album+" ("+DBAttributes.ALBUM_NAME+", "+DBAttributes.ARTIST_ID+")"+
								"VALUES ('"+album+"', "+0+")";
						statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
						rs=statement.getGeneratedKeys();
						rs.next();
						albumId=rs.getInt(1);
					}else{
						insert = "INSERT INTO "+DBTables.Album+" ("+DBAttributes.ALBUM_NAME+", "+DBAttributes.ARTIST_ID+")"+
								"VALUES ('"+album+"', "+artistId+")";
						statement.executeUpdate(insert, statement.RETURN_GENERATED_KEYS);
						rs=statement.getGeneratedKeys();
						rs.next();
						albumId=rs.getInt(1);
					
					}
				}else{
					System.out.println(information.toString());
					albumId = information.getJSONObject(0).getInt(DBAttributes.ALBUM_ID);
				}

				insert = "INSERT INTO "+DBTables.Tag+" ("+DBAttributes.TAG_NAME+","+DBAttributes.SONG_ID+")"+
						"VALUES ('"+tag+"',"+songId+")";
				statement.executeUpdate(insert);
				
				insert = "INSERT INTO "+DBTables.AlbumEntry+" ("+DBAttributes.ALBUM_ID+","+DBAttributes.SONG_ID+")"+
						"VALUES ("+albumId+", "+songId+")";
				statement.executeUpdate(insert);
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
	
	private void addPlaylist(String name){//TODO test
		Timestamp stamp = new Timestamp(System.currentTimeMillis());
		String insert = "INSERT INTO "+DBTables.Playlist+" ("+DBAttributes.NAME+")"+
						"VALUES ('"+name+"', "+stamp.toString()+")";
		query(insert);
	}
	
	private void addSongToPlaylist(int songId, int playlistId, int trackNumber){//TODO
		Timestamp stamp = new Timestamp(System.currentTimeMillis());
		JSONArray information =	getSong(DBTables.Song.toString(), ""+songId);
		String insert;
		if(!information.isNull(0)){
			insert= "SELECT "+DBAttributes.PLAYLIST_ID+" FROM "+DBTables.PlaylistEntry+" WHERE "+DBAttributes.PLAYLIST_ID+" LIKE '"+playlistId+"' "+
					"AND "+DBAttributes.SONG_ID+" = "+songId+
					"AND "+DBAttributes.NR+" = "+trackNumber;
			information=query(insert);
			if(information.isNull(0)){
				insert = "INSERT INTO "+DBTables.PlaylistEntry+" ("+DBAttributes.PLAYLIST_ID+", "+DBAttributes.SONG_ID+", "+DBAttributes.NR+")"+
						"VALUES ('"+playlistId+"', "+songId+", "+trackNumber+")";
				query(insert);
				insert = "UPDATE "+DBTables.Playlist+" SET "+DBAttributes.TIMESTAMP+" = "+stamp.toString()+" WHERE "+DBAttributes.PLAYLIST_ID+" = "+playlistId;
				logger.info("Song added to playlist.");
			}else{
				logger.error("Tracknumber in playlist already taken.");
			}
		}else{
			logger.error("Song not found.");
		}
	}
	
	private void removeSong(int ID){//TODO
		
	}
	
	private JSONArray search(String search){//TODO
		String get = "SELECT * FROM "+DBTables.Song+", "+DBTables.Artist+", "+DBTables.Album+", "+DBTables.Tag+", "+DBTables.Source+ "WHERE "+DBAttributes.TITLE+" LIKE '%"+search+"%'"+
				" OR "+DBAttributes.ARTIST_NAME+" LIKE '%"+search+"%'"+
				" OR "+DBAttributes.ALBUM_NAME+" LIKE '%"+search+"%'";
		return query(get);
	}
	
	private JSONArray getMyMusic(){//TODO test
		String get = "SELECT "+DBAttributes.ARTIST_NAME+", "+DBAttributes.TITLE+", "+DBAttributes.ALBUM_NAME+
					" FROM "+DBTables.Song+", "+DBTables.Album+", "+DBTables.Artist+
					" WHERE "+DBTables.Artist+"."+DBAttributes.ARTIST_ID+" = "+DBTables.Song+"."+DBAttributes.ARTIST_ID+
					" AND "+DBTables.AlbumEntry+"."+DBAttributes.SONG_ID+" = "+DBTables.Song+"."+DBAttributes.SONG_ID+
					" AND "+DBTables.AlbumEntry+"."+DBAttributes.ALBUM_ID+" = "+DBTables.Album+"."+DBAttributes.ALBUM_ID;		
		return query(get);
	}
	
	private JSONArray viewArtists(){
		String get = "SELECT "+DBAttributes.ARTIST_NAME+" FROM "+DBTables.Artist;
		return query(get);
	}
	
	private JSONArray viewAlbums(){
		String get = "SELECT "+DBAttributes.ALBUM_NAME+" FROM "+DBTables.Album;
		return query(get);
	}
	
	private JSONArray getAllEntrys(){
		String get = "SELECT "+DBAttributes.TITLE+", "+DBAttributes.ARTIST_NAME+
					" FROM "+DBTables.Song+", "+DBTables.Artist+
					" WHERE "+DBTables.Song+"."+DBAttributes.ARTIST_ID+" = "+DBTables.Artist+"."+DBAttributes.ARTIST_ID;
		return query(get);
	}
	private JSONArray getAllEntrys(String table){
		String get = "SELECT * FROM "+table;
		return query(get);
	}
	
	private JSONArray getAllSongInformation(){
		String get = "SELECT DISTINCT "+DBTables.Song+".*, "+DBTables.Artist+"."+DBAttributes.ARTIST_NAME+", "+DBTables.Album+"."+DBAttributes.ALBUM_NAME+", "+DBTables.Source+"."+DBAttributes.SOURCE_ID+", "+DBTables.Source+"."+DBAttributes.TYPE+", "+DBTables.Tag+"."+DBAttributes.TAG_NAME+
				" FROM "+DBTables.Song+", "+DBTables.Artist+", "+DBTables.Source+","+DBTables.Album+", "+DBTables.Tag+
				" WHERE "+DBTables.Song+"."+DBAttributes.SONG_ID+" = "+DBTables.Source+"."+DBAttributes.SONG_ID+
				" AND "+DBTables.Artist+"."+DBAttributes.ARTIST_ID+" = "+DBTables.Song+"."+DBAttributes.ARTIST_ID+
				" AND "+DBTables.Tag+"."+DBAttributes.SONG_ID+" = "+DBTables.Song+"."+DBAttributes.SONG_ID+
				" AND "+DBTables.Album+"."+DBAttributes.ALBUM_ID+" = (SELECT "+DBAttributes.ALBUM_ID+" FROM "+DBTables.AlbumEntry+" WHERE "+DBTables.AlbumEntry+"."+DBAttributes.SONG_ID+" = "+DBTables.Song+"."+DBAttributes.SONG_ID+")";
		return query(get);
	}
	
	private JSONArray getSong(String table, String ID){
		String get = "SELECT "+table+".*" +
				" FROM "+DBTables.Song+", "+DBTables.Artist+", "+DBTables.Source+","+DBTables.Album+
				" WHERE "+DBTables.Song+"."+DBAttributes.SONG_ID+" = "+ID+
				" AND "+DBTables.Artist+"."+DBAttributes.ARTIST_ID+" = "+DBTables.Song+"."+DBAttributes.ARTIST_ID+
				" AND "+DBTables.Source+"."+DBAttributes.SONG_ID+" = "+DBTables.Song+"."+DBAttributes.SONG_ID+
				" AND "+DBTables.Album+"."+DBAttributes.ALBUM_ID+" = (SELECT "+DBAttributes.ALBUM_ID+" FROM "+DBTables.AlbumEntry+" WHERE "+DBAttributes.SONG_ID+" = "+"'"+ID+"')";
		JSONArray x=query(get);
		x.forEach(e->System.out.println(e.toString()));
		return x;
	}
	
	private void addAllTables(){
		try {
			String table = "CREATE TABLE "+DBTables.Playlist + 
							"( "+DBAttributes.PLAYLIST_ID+" int NOT NULL AUTO_INCREMENT, "+
							DBAttributes.NAME+" varchar(255) NOT NULL, " + 
							DBAttributes.TIMESTAMP+" varchar(255), "+
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
					DBTables.ARTIST_ID+" int NOT NULL ,"+
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
