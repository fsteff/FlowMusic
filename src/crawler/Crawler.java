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

public class Crawler extends ThreadedComponent {

	private static final Logger logger = LoggerFactory.getLogger(Crawler.class);
	
	public Crawler(Central central) {
		super(Component.CRAWLER, central);
	}

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

						JSONObject data = new JSONObject();
						data.put("title", mp3.getTitle());
						data.put("artist", mp3.getArtist());
						data.put("album", mp3.getAlbum());
						data.put("path", path);
						mp3Files.put(data);

					} catch (Exception e) {
						// do nothing
					}
				}
			}
		}
	}

	public void shutdown() {
	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg) throws Exception {
		if (sender == Component.CENTRAL) {
			String command = msg.getString("command");
			if (command.equalsIgnoreCase("start")) {
				// gets the paths that should be searched
				sendMessage(Component.CENTRAL, Central.Messages.getConfig(), this.onNewConfig);
				return new JSONObject("{\"answer\":\"started\"}");

			} else if (command.equalsIgnoreCase("config changed")) {
				this.onNewConfig.accept(msg);
			} else if (command.equalsIgnoreCase("shutdown")) {
				shutdown();
				return new JSONObject("{\"answer\":\"done\"}");
			}
		}
		return null;
	}

	private Consumer<JSONObject> onNewConfig = jsonObject -> {
		JSONObject cfg = jsonObject.getJSONObject(Central.Messages.CONFIG);
		JSONArray paths = cfg.optJSONArray(Central.Config.MUSIC_DIRS);
		String[] params = new String[paths.length()];
		for (int i = 0; i < paths.length(); i++) {
			params[i] = paths.getString(i);
		}
        JSONArray mp3Files = new JSONArray();
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
