function PlayBar(){

    this.root = $('#playbar');
    var playbutton = $('<div class="playbutton"></div>');
    var nextbutton = $('<div class="nextbutton"></div>');
    var info = $(' <div class="playbar-info"></div>');

    this.playbutton = playbutton;
    this.nextbutton = nextbutton;
    this.info = info;

    this.playbutton.appendTo(this.root);
    this.nextbutton.appendTo(this.root);
    this.info.appendTo(this.root);


    this.playbutton.click(function(){
        var player = Central.getPlayer().getCurrentPlayer();
        if(player != null) {
            if (!player.playing()) {
                player.play();
                $(this).attr("class", "pausebutton");
            } else {
                player.pause();
                $(this).attr("class", "playbutton");
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

    Central.getPlayer().getPlaylist().addListener(function(song){
        if(song != null) {
            info.html(song.artist + " - " + song.title);
        }
    });
}


$(document).ready(function(){
    var playbar = new PlayBar();
});
