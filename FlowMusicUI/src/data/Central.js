import MusicPlayer from './MusicPlayer.js';


var central = null;
class Central{
    constructor(){

        this.player = new MusicPlayer();
        central = this;
    }

    static getInstance(){
        if(central == null){
            central  = new Central();
        }
        return central;
    }

    static getPlayer(){
        return Central.getInstance().player;
    }
}

export default Central;

