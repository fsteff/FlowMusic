/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

var ytPlayerInstance = null;
$(document).ready(function() {


    function YoutubePlayer() {
        this.element = $("<div class='w3-card-4' id=\"yt-frame\"></div>");
        this.element.appendTo($("body"));


        // 2. This code loads the IFrame Player API code asynchronously.
        var ytscript = document.createElement('script');
        ytscript.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(ytscript, firstScriptTag);

        // 3. This function creates an <iframe> (and YouTube player)
        //    after the API code downloads.
        this.player = null;
        this.settings = {playing: false, volume: 100}
        this.playerReady = false;
    }



    // 4. The API will call this function when the video player is ready.
    YoutubePlayer.prototype.onPlayerReady = function (event) {
        ytPlayerInstance.playerReady = true;
        ytPlayerInstance.setVolume(100);
        if(ytPlayerInstance.settings.playing) {
            event.target.playVideo();
        }
    }

    YoutubePlayer.prototype.onPlayerStateChange = function (event) {
        if (event.data == YT.PlayerState.ENDED ) {
            ytPlayerInstance.unload();
            Central.getPlayer().nextSong();
            //setTimeout(stopVideo, 6000);
        }
    }
    YoutubePlayer.prototype.pause = function () {
        if(this.player != null && this.playerReady) {
            this.player.pauseVideo();
        }
        this.settings.playing = false;
    }
    YoutubePlayer.prototype.play = function(){
        if(this.player != null && this.playerReady) {
            this.player.playVideo();
        }
        this.settings.playing = true;
        var playlist = Central.getPlayer().getPlayQueue();
        playlist.notifyListeners(playlist.current());
    }
    YoutubePlayer.prototype.load = function(videoid){

        if(this.player != null){
            $("#yt-frame").show();
            this.player.loadVideoById(videoid);

        }else {
            this.playerReady = false;
            this.player = new YT.Player('yt-frame', {
                //default 640x360
                height: '180',
                width: '320',
                videoId: videoid,
                playerVars: {'autoplay': 0, 'controls': 1},
                events: {
                    'onReady': this.onPlayerReady,
                    'onStateChange': this.onPlayerStateChange
                }
            });
        }
    }
    YoutubePlayer.prototype.stop = function(){
        this.unload();
    }
    YoutubePlayer.prototype.unload = function(){
       // this.playerReady = false;
        if(this.player != null) {
            this.player.stopVideo();
            //this.player = null;
        }
        $("#yt-frame").hide();
        //$("#yt-frame").html("");
        this.settings.playing = false;
    }

    YoutubePlayer.prototype.setVolume = function(percent){
        if(this.playerReady) {
            this.player.setVolume(percent);
        }
        this.settings.volume = percent;
    }

    YoutubePlayer.prototype.getTime = function(){
        if(this.playerReady) {
            return this.player.getCurrentTime();
        }else{
            return 0;
        }
    }

    YoutubePlayer.prototype.getDuration = function(){
        if(this.playerReady) {
            return this.player.getDuration();
        }else{
            return 0;
        }
    }

    ytPlayerInstance = extend(BaseMusicPlayer, YoutubePlayer, "youtube");

    /*
    function YoutubePreview(element, videoid) {
        this.element = element;

        this.player = new YT.Player(element, {
            //default 640x360
            height: '180',
            width: '320',
            videoId: videoid,
            playerVars: {'autoplay': 0, 'controls': 1},
        });
    }

    YoutubePreview.prototype.destroy = function(){
        this.element.hide();
        this.player.destroy();
    }
    */
/*
    function YoutubeSearch(){
        this.apikey = "AIzaSyAvxru3VA2YzJxmx1R403Y6KeTPwHrLR_w";
    }

    YoutubeSearch.prototype.search = function(query){

    }

    ytSearchInstance = extend(BaseSearchEngine, YoutubeSearch, "youtube");
    Central.getSearch().addPlugin(ytSearchInstance);
*/
});

function onYouTubeIframeAPIReady() {
    Central.getPlayer().addPlugin(ytPlayerInstance);
}
