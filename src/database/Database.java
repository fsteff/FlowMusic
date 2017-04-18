package database;

import org.json.JSONObject;

import central.Central;
import central.Component;
import central.ThreadedComponent;

public class Database extends ThreadedComponent {

	public Database(Central central) {
		super(Component.DATABASE, central);
		// TODO Auto-generated constructor stub
	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg) throws Exception {
		// TODO Auto-generated method stub
		return null;
	}

}
