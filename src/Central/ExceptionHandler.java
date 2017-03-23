package Central;

/**
 * Centralized Exception handler - use only this for error output.
 * @author Stefan Fixl
 */
class ExceptionHandler {
	static void onException(Exception e){
		e.printStackTrace();
	}
}
