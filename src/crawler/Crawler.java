package crawler;

import org.json.JSONObject;

import central.Central;
import central.Component;
import central.ThreadedComponent;

public class Crawler extends ThreadedComponent {

	public Crawler(Central central) {
		super(Component.CRAWLER, central);
		// TODO Auto-generated constructor stub
	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg) throws Exception {
		// TODO Auto-generated method stub
		return null;
	}

}
