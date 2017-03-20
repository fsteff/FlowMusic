import org.json.JSONObject;

public class TestMain {

	public static void main(String[] args) {
		JSONObject testobj = new JSONObject();
		testobj.put("test", "Hello world");
		System.out.println(testobj.toString());
	}

}
