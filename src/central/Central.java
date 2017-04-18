package central;

import java.util.Vector;

import org.json.JSONObject;

import webserver.HelloJetty;

/**
 * Main Class that controls all the other components.
 * @author Stefan Fixl
 *
 */
public class Central extends ThreadedComponent{
	private Vector<ThreadedComponent> components;
	
	Central(){
		super(Component.CENTRAL, null);
		this.components = new Vector<ThreadedComponent>();
		this.setCentral(this);
		this.components.addElement(this);
		
	}
	
	void newMessage(Message msg){
		for(ThreadedComponent component : components){
			if(msg.recipient == component.componentType || msg.recipient == Component.ANY){
				component.addMessage(msg);
			}
		}
	}
	
	// TODO: implement good system for component loading
	
	public static void main(String[] args){
		Central central = new Central();
		central.components.addElement(new HelloJetty(central));
		JSONObject json = new JSONObject();
		json.put("command", "start");
		
		central.sendMessage(Component.WEBSERVER, json, msg -> System.out.println("Webserver started: "+msg.getString("answer")));
	}

	@Override
	protected JSONObject onMessage(Component sender, JSONObject msg) throws Exception {
		System.out.println(msg);
		return null;
	}
}
