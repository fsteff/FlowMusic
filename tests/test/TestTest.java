package test;

import static org.junit.Assert.*;

import org.json.JSONObject;
import org.junit.Test;

public class TestTest {

	@Test
	public void test() {
		JSONObject testobj = new JSONObject();
		testobj.put("test", "Hello world");
		String t = testobj.toString();
		assertEquals("org.json does not work", "{\"test\":\"Hello world\"}", t);
	}

}
