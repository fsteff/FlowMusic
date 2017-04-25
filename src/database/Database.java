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

public class Database extends ThreadedComponent {
	Connection databaseConnection;

	public Database(Central central, File folder) {
		super(Component.DATABASE, central);
		
		try {
			// Save tha database at the user home directory, subdirectory .Flowmusic
			String dbName = "~/.FlowMusic/data";
			// or, if specified, use this instead
			if(folder != null){
				dbName = folder.getName();
			}
			
			Class.forName("org.h2.Driver");
			databaseConnection = DriverManager.getConnection("jdbc:h2:"+dbName);
			
			// TODO: create Database if empty
			
		}catch( ClassNotFoundException e){
			ExceptionHandler.showErrorDialog(e);
		}catch (SQLException e) {
			ExceptionHandler.showErrorDialog(e);
		}
	}
	
	public Database(Central central) {
		this(central, null);
	}
	

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg) throws Exception {
		String command = msg.getString("command");
		switch(command){
		case "get":
			// TODO: further selection, filtering, joining, ...
			JSONArray res = query("SELECT * FROM songs");
			JSONObject ret = new JSONObject();
			ret.put("answer", res);
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
		}
		
		return result;
	}

}
