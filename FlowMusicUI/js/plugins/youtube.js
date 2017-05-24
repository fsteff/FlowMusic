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
        this.settings.playing = false;
        if(this.player != null && this.playerReady) {
            this.player.pauseVideo();
        }
    }
    YoutubePlayer.prototype.play = function(){
        this.settings.playing = true;
        if(this.player != null && this.playerReady) {
            this.player.playVideo();
        }

   //      var playlist = Central.getPlayer().getPlayQueue();
   //     playlist.notifyListeners(playlist.current());
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
    YoutubePlayer.prototype.tryLoadSource = function(source, callback){
    /*    var elem = $("<div style='visibility: hidden'></div>");
        // TODO: check if neccessary
        elem.appendTo("body");



        var player = new YT.Player(elem,{
            height: '180',
            width: '320',
            videoId: source,
            playerVars: {'autoplay': 0, 'controls': 0},
            events: {
                'onReady': function(){},
                'onStateChange': function(){

                }
            }
        });*/
        callback(true);

    }

    ytPlayerInstance = extend(BaseMusicPlayer, YoutubePlayer, "youtube");


    function YoutubePreview() {

    }

    YoutubePreview.prototype.supportsUrl = function(url){
        if(url.search("youtube.com\/watch") >= 0) return true;
        if(url.search("youtu.be") >= 0) return true;
    }

    YoutubePreview.prototype.preview = function(element, url, callback){
        this.element = $(element);
        var videoid = "";
        if(url.search("youtube.com/watch") >= 0){
            videoid = getParameterByName("v", url);
        }else{
            var split = url.split(".be/");
            videoid = split[1];
        }
        const title = $('<div>loading title...</div>');
        title.appendTo(this.element);

        const imgUrl = "http://img.youtube.com/vi/"+videoid+"/0.jpg";
        const img = $('<img src="'+imgUrl+'"/>');
        img.appendTo(this.element);


        LocalComm.newMessage({command: "get url",url: url},
            Message.Components.GUI, function(data){
                if(typeof data.answer !== 'undefined' && data.answer !== null){
                    var html = data.answer;
                    // todo remove scripts from html
                    const doc = document.implementation.createHTMLDocument('yt');
                    doc.documentElement.innerHTML = html;

                    var vidname = doc.title;
                    // remove " - YouTube"
                    title.html(vidname.substring(0, vidname.length-10));

                    // remove unneccesary information
                    vidname = vidname.replace(" - YouTube", "");
                    vidname = vidname.replace(" (Official Video)", "");
                    vidname = vidname.replace(" [Official Video]", "");
                    vidname = vidname.replace(" (Official)", "");
                    vidname = vidname.replace(" (official)", "");
                    vidname = vidname.replace(" (Audio)", "");
                    vidname = vidname.replace(" [Cover Art]", "");
                    vidname = vidname.replace(" [cover art]", "");
                    vidname = vidname.replace(" (Lyric)", "");
                    vidname = vidname.replace(" (lyric)", "");


                    var song = {title: vidname, type: "youtube", value: videoid};
                    var split = vidname.split("-");
                    if(split.length >= 2){
                        song.artist = split[0].trim();
                        song.title = split[1].trim();
                    }

                    callback(song);
                }
            });
    }

    Central.getUrlPreview().addPlugin(extend(BaseUrlPreview, YoutubePreview, "youtube"));


/*
    function YoutubeSearch(){
        //this.apikey = "AIzaSyAvxru3VA2YzJxmx1R403Y6KeTPwHrLR_w";
    }

    YoutubeSearch.prototype.search = function(query, callback){
        var retval =  [{
            artist: "Martin Garrix & Bebe Rexha",
            title: "In the Name of Love",
            sources: [{
                plugin: "youtube",
                source: "AeGfss2vsZg"
            }]
        }];

        callback(retval);
    }

    ytSearchInstance = extend(BaseSearchEngine, YoutubeSearch, "youtube");
    Central.getSearch().addPlugin(ytSearchInstance);*/

});

function onYouTubeIframeAPIReady() {
    Central.getPlayer().addPlugin(ytPlayerInstance);
}
