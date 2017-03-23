package central;

import java.util.Vector;
import org.json.JSONObject;
import webserver.HelloJetty;

/**
 * Main Class that controls all the other components.
 * @author Stefan Fixl
 *
 */
public class Central {
	private Vector<ThreadedComponent> components;
	
	Central(){
		components = new Vector<ThreadedComponent>();
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
		central.newMessage(
				new Message(Component.CENTRAL, Component.WEBSERVER, json.toString()));
	}
}
