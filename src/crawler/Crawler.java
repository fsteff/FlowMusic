package crawler;

import java.io.File;

import java.util.HashSet;
import java.util.Set;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import central.Central;
import central.Component;
import central.ThreadedComponent;

public class Crawler extends ThreadedComponent {

	private static final Logger logger = LoggerFactory.getLogger(Crawler.class);

	Set<String> mp3Files = new HashSet<>();

	public Crawler(Central central) {
		super(Component.CRAWLER, central);
	}

	public String[] getPaths(File file) {
		File[] files = file.listFiles();
		if (files != null) {
			String[] paths = new String[files.length];
			for (int i = 0; i < files.length; i++) {
				paths[i] = files[i].getPath();
			}
			return paths;
		} else {
			return null;
		}
	}

	public Integer searchForMp3(String[] paths) {
		if (paths != null) {
			for (String path : paths) {
				File file = new File(path);
				if (file.isDirectory()) {
					searchForMp3(getPaths(file));
				} else if (path.endsWith(".mp3")) {
					mp3Files.add(path);
				}
			}
		}
		return mp3Files.size();
	}

	public void shutdown() {
		mp3Files = null;
	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg) throws Exception {
		/*if (sender == Component.CENTRAL) {
			String command = msg.getString("command");
			if (command.equalsIgnoreCase("start")) {

				String[] params = new String[msg.getJSONArray("params").length()];
				for (int i = 0; i < msg.getJSONArray("params").length(); i++) {
					params[i] = (String) msg.getJSONArray("params").get(i);
				}

				int numberOfMp3 = searchForMp3(params);
				return new JSONObject(String.format("{\"answer\":\"done\",\"found\":%d}", numberOfMp3));
			}
			if (command.equalsIgnoreCase("shutdown")) {
				shutdown();
				return new JSONObject("{\"answer\":\"done\"}");
			}
		}*/
		return null;
	}

}
