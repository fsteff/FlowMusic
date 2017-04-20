/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

// TODO: implement https://github.com/audiocogs/aurora.js or offline decoder to wav

function LocalFilePlayer() {
   // this.name = "local";
    var elem = "localaudio-frame";
    $("body").append("<audio id=" + elem + " controls></audio>");
    this.audio = document.getElementById(elem);

    // go to next song if the currend one ended
    $(this.audio).on("ended", function () {
        Central.getPlayer().nextSong();
    });
}

LocalFilePlayer.prototype.play = function () {
    this.audio.play();
    this.settings.playing = true;
}
LocalFilePlayer.prototype.pause = function () {
    this.audio.pause();
    this.settings.playing = false;
}
LocalFilePlayer.prototype.load = function (source) {
    this.audio.src = source;

}

LocalFilePlayer.prototype.setVolume = function (volume) {
    this.settings.volume = volume;
    this.audio.volume = volume * 0.01;
}
LocalFilePlayer.prototype.getVolume = function () {
    this.settings.volume = this.audio.volume * 100;
    return this.settings.volume;
}
LocalFilePlayer.prototype.getTime = function () {
    return this.audio.currentTime;
}
LocalFilePlayer.prototype.getDuration = function () {
    return this.audio.duration;
}
LocalFilePlayer.prototype.stop = function(){
    this.pause();
}


LocalSearchEngine = function(){

}

LocalSearchEngine.prototype.search = function(query){
    $.post( "jsontest", {varname: "this is a test"});

    return [{
        title: "Resurrection",
        artist: "Klaas & Niels Van Gogh",
        sources:[
            {
                plugin: "local",
                source: "testx.mp3"
            }
        ]
    },{
        title: "Resurrection",
        artist: "Klaas & Niels Van Gogh",
        sources:[
            {
                plugin: "youtube",
                source: "s6E5lCctlHs"
            }
        ]
    }];
}

Central.getSearch().addPlugin(extend(BaseSearchEngine, LocalSearchEngine, "local"));

// Add to main Music Player
Central.getPlayer().addPlugin(extend(BaseMusicPlayer, LocalFilePlayer, "local"));

