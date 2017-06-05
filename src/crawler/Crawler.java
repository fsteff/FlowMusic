package crawler;

import java.io.File;

import java.util.function.Consumer;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import central.Central;
import central.Component;
import central.ThreadedComponent;
import crawler.file.MP3File;

/**
 * The crawler searches through a given file path for mp3 files
 * and sends them to the database
 *  
 *  @author Vanessa Fediuk
 */
public class Crawler extends ThreadedComponent {

	private static final Logger logger = LoggerFactory.getLogger(Crawler.class);
	private JSONArray mp3Files = new JSONArray();
	private String title="";
	private String artist="";
	
	public Crawler(Central central) {
		super(Component.CRAWLER, central);
	}
	

	/**
	 * gets all paths of the files in the given directory
	 * 
	 * @ @param file
	 */
	public String[] getPaths(File file) {
		// gets all files in the given file
		File[] files = file.listFiles();
		if (files != null) {
			// gets the paths of the files
			String[] paths = new String[files.length];
			for (int i = 0; i < files.length; i++) {
				paths[i] = files[i].getPath();
			}
			return paths;
		} else {
			return null;
		}
	}

	/**
	* searches in the given paths for mp3Files
	* and adds them to a JSONArray
	* 
	* @param mp3Files,paths
	*/
	public void searchForMp3(JSONArray mp3Files, String[] paths) {
		
		if (paths != null) {
			// test for each file if it is a directory
			for (String path : paths) {
				File file = new File(path);
				if (file.isDirectory()) {
					// searches all files in the given file for mp3 files
					searchForMp3(mp3Files, getPaths(file));

				} else if (path.endsWith(".mp3")) {
					// tests if the file is a mp3 file and adds it to the
					// already found ones if it is
					try {
						MP3File mp3 = new MP3File(path);
						//if the data in the mp3 file for title or artist is empty 
						//get it form the file name
						title=mp3.getTitle();
						artist=mp3.getArtist();
						testForNullValues(file);
						
						//saves the found data in a JSONObject to put it in the JSONArray
						JSONObject data = new JSONObject();
						data.put("title", title);
						data.put("artist", artist);
						data.put("album", mp3.getAlbum());
						data.put("path", path);
						mp3Files.put(data);

					} catch (Exception e) {
						//if the file has no tag get the data for title and artist from the file name 
						title="";
						artist="";
						testForNullValues(file);
						
						//saves the existing data in s JSONObject to put it in the JSONArray
						JSONObject data = new JSONObject();
						data.put("title", title);
						data.put("artist", artist);
						data.put("path", path);
						mp3Files.put(data);
					}
				}
			}
		}
	}

	/**
	 * gets the title or the artist from the file name
	 * 
	 * @param file
	 */
	public void testForNullValues(File file){
		int i=0;
		//gets the title from the file name if it was empty
		if(title.equals("")){
			StringBuffer sb1=new StringBuffer();
			//if the file name contains a '-' we assume that the second part is the title
			if(file.getName().contains("-")){
				i=file.getName().indexOf('-')+1;
				while(!file.getName().substring(i, i+4).equalsIgnoreCase(".mp3")){
					sb1.append(file.getName().charAt(i));
					i++;
				}
			//if the file name has no special form the full name is the title
			}else{
				while(!file.getName().substring(i, i+4).equalsIgnoreCase(".mp3")){
					sb1.append(file.getName().charAt(i));
					i++;
				}		
			}
			title=sb1.toString();
		}
		//gets the artist form the file name if it was empty
		//if the file name contains a '-' we assume that the first part is the artist
		if(artist.equals("")&&file.getName().contains("-")){
			i=0;
			StringBuffer sb2=new StringBuffer();
			while(file.getName().charAt(i)!='-'){
				sb2.append(file.getName().charAt(i));
				i++;
			}
			artist=sb2.toString();
		}
	}
	
	public void shutdown() {
	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg) throws Exception {
		if (sender == Component.CENTRAL) {
			String command = msg.getString("command");
			if (command.equalsIgnoreCase("start")) {
				// gets the paths and searches them
				sendMessage(Component.CENTRAL, Central.Messages.getConfig(), this.onNewConfig);
				return new JSONObject("{\"answer\":\"started\"}");

			} else if (command.equalsIgnoreCase("config changed")) {
				//searches for mp3files if the to search paths have changed
				this.onNewConfig.accept(msg);
			} else if (command.equalsIgnoreCase("shutdown")) {
				//shuts the crawler down
				shutdown();
				return new JSONObject("{\"answer\":\"done\"}");
			}
		}
		return null;
	}

	/**
	 * gets the paths to searches them for mp3 files and updates the database
	 */
	private Consumer<JSONObject> onNewConfig = jsonObject -> {
		//gets the paths that should be searched
		JSONObject cfg = jsonObject.getJSONObject(Central.Messages.CONFIG);
		JSONArray paths = cfg.optJSONArray(Central.Config.MUSIC_DIRS);
		String[] params = new String[paths.length()];
		for (int i = 0; i < paths.length(); i++) {
			params[i] = paths.getString(i);
		}
		searchForMp3(mp3Files,params);
		JSONArray found = mp3Files;

		// updates Database
		JSONObject uMsg = new JSONObject();
		uMsg.put("command", "updateFolder");
		uMsg.put("found", found);
		try {
			sendMessage(Component.DATABASE, uMsg);
		} catch (InterruptedException e) {
			logger.error("", e);
		}
	};

	@Override
	protected void sendMessage(Component recipient, JSONObject msg, Consumer<JSONObject> onAnswer)
			throws InterruptedException {
		super.sendMessage(recipient, msg, onAnswer);
	}

}
