import YouTubePlayer from 'yt-player';
import BaseMusicPlayer from './BaseMusicPlayer';

class Youtube extends  BaseMusicPlayer{
    constructor(settings, elem) {
        super(settings);
        this.player = new YouTubePlayer(elem);
        this.setVolume(this.settings.volume);
    }

    play(){
        this.player.play();
        this.setVolume(this.settings.volume);
        this.settings.playing = true;
    }

    pause(){
        this.player.pause();
        this.settings.playing = false;
    }

    load(videoId){
        this.player.load(videoId);
    }
    setVolume(volume){
        this.player.setVolume(volume);
        this.settings.volume = volume;
    }
    getVolume(){
        return this.player.getVolume();
    }
    getTime(){
        return this.player.getCurrentTime();
    }

    getDuration(){
        return this.player.getDuration();
    }

}

export default Youtube;