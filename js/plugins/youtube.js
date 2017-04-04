var ytInstance = null;
$(document).ready(function() {


    function Youtube() {
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
    Youtube.prototype.onPlayerReady = function (event) {
        ytInstance.setVolume(100);
        if(ytInstance.settings.playing) {
            event.target.playVideo();
        }
        ytInstance.playerReady = true;
    }

    Youtube.prototype.onPlayerStateChange = function (event) {
        if (event.data == YT.PlayerState.ENDED ) {
            ytInstance.unload();
            Central.getPlayer().nextSong();
            //setTimeout(stopVideo, 6000);
        }
    }
    Youtube.prototype.pause = function () {
        if(this.player != null && this.playerReady) {
            this.player.pauseVideo();
        }
        this.settings.playing = false;
    }
    Youtube.prototype.play = function(){
        if(this.player != null && this.playerReady) {
            this.player.playVideo();
        }
        this.settings.playing = true;
    }
    Youtube.prototype.load = function(videoid){

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
                playerVars: {'autoplay': 0, 'controls': 0},
                events: {
                    'onReady': this.onPlayerReady,
                    'onStateChange': this.onPlayerStateChange
                }
            });
        }
    }
    Youtube.prototype.stop = function(){
        this.unload();
    }
    Youtube.prototype.unload = function(){
       // this.playerReady = false;
        if(this.player != null) {
            this.player.stopVideo();
            //this.player = null;
        }
        $("#yt-frame").hide();
        //$("#yt-frame").html("");
        this.settings.playing = false;
    }

    Youtube.prototype.setVolume = function(percent){
        this.player.setVolume(percent);
        this.settings.volume = percent;
    }

    ytInstance = extend(BaseMusicPlayer, Youtube, "youtube");
});

function onYouTubeIframeAPIReady() {
    Central.getPlayer().addPlugin(ytInstance);
}
