package central;

import javax.swing.JOptionPane;

/**
 * Centralized Exception handler - use only this for error output.
 * 
 * @author Stefan Fixl
 */
public class ExceptionHandler
{
	private ExceptionHandler()
	{

	}

	public static void showErrorDialog(String title, String message)
	{
		JOptionPane.showMessageDialog(null, message, title,
				JOptionPane.ERROR_MESSAGE);
	}

	public static void showErrorDialog(Throwable t)
	{
		showErrorDialog("" + t.getCause(), t.getMessage());
	}
}
