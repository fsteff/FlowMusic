import LocalFilePlayer from './LocalFilePlayer.js';
import Youtube from './Youtube.js';
import PlayerSettings from './PlayerSettings.js';
import Playlist from './Playlist.js';

class MusicPlayer{
    constructor(){
        this.currentPlayer = null;
        this.playlist = null;
        this.currentSong = null;

        this.settings = new PlayerSettings();
        this.fileplayer = new LocalFilePlayer(this.settings, 'audioelement');
         this.youtube = null; //new Youtube(this.settings, 'youtubeelement');

        this.playlist = new Playlist();

        this.playlist.add({
            artist: "Klaas & Niels Van Gogh",
            title: "Resurection (In Space)",
            source: "local",
            file : "test.mp3"
        });
        this.playlist.add({
            artist: "Maxim",
            title: "Meine Soldaten",
            source: "local",
            file : "test2.mp3"
        });

        this.playlist.add({
            artist: "DJ Toxic Waste",
            title: "Feedom 2k14",
            source: "youtube",
            videoid : "Do7-LR6Mrsg"
        });

        this.currentSong = this.playlist.current();
        this.currentPlayer = this.fileplayer;
        this.currentPlayer.load(this.currentSong.file);


        //this.nextSong();
    }

    getCurrentPlayer(){
        return this.currentPlayer;
    }
    getCurrentSong(){
        return this.currentSong;
    }

    nextSong(){
        this.currentSong = this.playlist.next();
        switch(this.currentSong.source){
            case "local":
                this.currentPlayer = this.fileplayer;
                this.currentPlayer.load(this.currentSong.file);
                break;
            case "youtube":
                this.currentPlayer = this.youtube;
                this.currentPlayer.load(this.currentSong.videoid);
                break;
        }
        this.currentPlayer.play();
    }

}

export default MusicPlayer;
