import BaseMusicPlayer from './BaseMusicPlayer';

class LocalFilePlayer extends BaseMusicPlayer{
    constructor(/* PlayerSettings */ settings, elem){
        super(settings)
        // PlayerSettings
        this.settings = settings;

        this.audio = document.getElementById(elem);

    }
    play(){
        this.audio.play();
        this.settings.playing = true;
    }
    pause(){
        this.audio.pause();
        this.settings.playing = false;
    }
    load(source){
        this.audio.src = source;
    }

    setVolume(volume){
        this.settings.volume = volume;
        this.audio.volume = volume * 0.01;
    }
    getVolume(){
        this.settings.volume = this.audio.volume * 100;
        return this.settings.volume;
    }
    getTime(){ return 0;}
    getDuration(){return 0;}
}

export default LocalFilePlayer;