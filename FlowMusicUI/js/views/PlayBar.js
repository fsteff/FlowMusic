/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

function PlayBar(){
    const self = this;

    this.root = $('#playbar');
    var playbutton = $('<div class="playbutton"></div>');
    var nextbutton = $('<div class="nextbutton"></div>');
    var backbutton = $('<div class="backbutton"></div>');
    var info = $(' <div class="playbar-info"></div>');

    backbutton.appendTo(this.root);
    playbutton.appendTo(this.root);
    nextbutton.appendTo(this.root);
    info.appendTo(this.root);

    this.playbutton = playbutton;
    this.nextbutton = nextbutton;
    this.backbutton = backbutton;
    this.info = info;

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
    this.nextbutton.click(function(){
        var player = Central.getPlayer();
        if(player.getCurrentPlayer() != null){
            player.nextSong();
            playbutton.attr("class", "pausebutton");
        }
    });
    this.backbutton.click(function(){
        var player = Central.getPlayer();
        if(player.getCurrentPlayer() != null){
            player.lastSong();
            playbutton.attr("class", "pausebutton");
        }
    });

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
}

