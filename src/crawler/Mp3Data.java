package crawler;

public class Mp3Data {

	private String path;
	private String title;
	private String artist;
	private String album;
	
	public Mp3Data(String title, String artist, String album, String path){
		this.path=path;
		this.title=title;
		this.artist=artist;
		this.album=album;
	}
	
	public String getPath(){
		return path;
	}
	public String getTitel(){
		return title;
	}
	public String getArtist(){
		return artist;
	}
	public String getAlbum(){
		return album;
	}
}
