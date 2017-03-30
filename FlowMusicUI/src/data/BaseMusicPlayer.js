class BaseMusicPlayer {
    constructor(/* PlayerSettings */ settings){
        // PlayerSettings
        this.settings = settings;
    }
    play(){
        this.settings.playing = true;
    }
    pause(){
        this.settings.playing = false;
    }
    load(source){    }

    setVolume(volume){
        this.settings.volume = volume;
    }
    getVolume(){
        return this.settings.volume;
    }
    getTime(){}
    getDuration(){return 0;}


}


export default BaseMusicPlayer;