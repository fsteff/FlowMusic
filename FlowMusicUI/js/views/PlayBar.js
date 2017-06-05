/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

/**
 * View for controlling the music player (blue bar at the bottom)
 * @constructor
 */
function PlayBar(){
    const self = this;

    this.root = $('#playbar');
    var playbutton = $('<div class="playbutton"></div>');
    var nextbutton = $('<div class="nextbutton"></div>');
    var backbutton = $('<div class="backbutton"></div>');
    var info = $(' <div class="playbar-info"></div>');
    var progressbar = $('<div class="progressbar"></div>')

    backbutton.appendTo(this.root);
    playbutton.appendTo(this.root);
    nextbutton.appendTo(this.root);
    info.appendTo(this.root);
    progressbar.appendTo(this.root);

    this.playbutton = playbutton;
    this.nextbutton = nextbutton;
    this.backbutton = backbutton;
    this.info = info;

    // on playbutton click: either play or pause the song
    this.playbutton.click(function(){
        var player = Central.getPlayer().getCurrentPlayer();
        if(player != null) {
            if (!player.playing()) {
                player.play();
                playbutton.attr("class", "pausebutton");
            } else {
                player.pause();
                playbutton.attr("class", "playbutton");
            }
        }
    });
    // on next button click play the next song
    this.nextbutton.click(function(){
        var player = Central.getPlayer();
        if(player.getCurrentPlayer() != null){
            player.nextSong();
            playbutton.attr("class", "pausebutton");
        }
    });
    // on back button click play the previous song
    this.backbutton.click(function(){
        var player = Central.getPlayer();
        if(player.getCurrentPlayer() != null){
            player.lastSong();
            playbutton.attr("class", "pausebutton");
        }
    });

    // add a playqueue listener to update the song name and the play state
    Central.getPlayer().getPlayQueue().addListener(function(song){
        if(song !== null) {
            info.html(song.artist + " - " + song.title);
            var player = Central.getPlayer().getCurrentPlayer();
            if(player != null && player.settings.playing) {
                playbutton.attr("class", "pausebutton");
            }else{
                playbutton.attr("class", "playbutton");
            }
        }
    });

    // every second update the progress bar
    window.setInterval(function(){
        var player = Central.getPlayer().currentPlayer;
        if(player != null && player.getTime() != 0) {
            var part = player.getDuration() / (player.getTime() + 0.001);
            var pixels = 0;
            if (part != 0) {
                pixels = self.root.width() / part;
            }
            progressbar.animate({width: pixels + 'px'}, 1000);
        }
    }, 1000);
}

