import React, { Component } from 'react';
import Central from '../data/Central.js';
import '../css/PlayBar.css';

const PLAY = <img src="play.png"/>;
const PAUSE = <img src="pause.png"/>;
const NEXT = <img src="next.png"/>;

class PlayBar extends Component{

    onPlay(event){
        var player = Central.getPlayer().getCurrentPlayer();
        if(player.settings.playing === false) {
            player.play();
            event.currentTarget.firstChild.src = "pause.png";
        }else {
            player.pause();
            event.currentTarget.firstChild.src = "play.png";
        }

     /*   //this.updateTitle(event);
        var song = Central.getPlayer().getCurrentSong();
        var html = song.artist + "-" + song.title;
        event.currentTarget.innerHTML = html;*/

        var song = Central.getPlayer().getCurrentSong();
        document.getElementsByClassName("songInfo").forEach(function() {
            this.innerHTML = song.artist + " - " + song.title;
        });
    }

    onNext(event){
        var player = Central.getPlayer();
        player.nextSong();

    /*    var song = Central.getPlayer().getCurrentSong();
        var html = song.artist + "-" + song.title;
        event.currentTarget.innerHTML = html;*/

        var song = Central.getPlayer().getCurrentSong();
        document.getElementsByClassName("songInfo").forEach(function() {
            this.innerHTML = song.artist + " - " + song.title;
        });
    }




    render() {

        return (
            <div className="PlayBar">
                <div onClick={this.onPlay} className="playButton">{PLAY}</div>
                <div onClick={this.onNext} className="nextButton">{NEXT}</div>
                <div className="songInfo">no song loaded</div>
                <audio id="audioelement"></audio>
                <div id="youtubeelement"></div>
            </div>

        );
    };
}

export default PlayBar;