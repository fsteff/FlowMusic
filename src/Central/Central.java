package Central;

import java.util.Vector;
import java.util.concurrent.ConcurrentHashMap;

import org.json.JSONObject;

import webserver.HelloJetty;

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
	
	public static void main(String[] args){
		Central central = new Central();
		central.components.addElement(new HelloJetty(central));
		JSONObject json = new JSONObject();
		json.put("command", "start");
		central.newMessage(
				new Message(Component.CENTRAL, Component.WEBSERVER, json.toString()));
	}
}
