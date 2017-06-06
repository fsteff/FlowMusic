/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 *
 * Note to this file: this is ECMAScript 6
 * Only modern browsers support this!
 */

var ytPlayerInstance = null;

/**
 * BaseMusicPlayer for Youtube videos
 * see /js/models/PluginBase for more detail
 */
class YoutubePlayer extends BaseMusicPlayer {
    /**
     * @constructor
     */
    constructor() {
        super("youtube");
        this.element = $("<div id=\"yt-frame\"></div>");
        this.element.appendTo($("body"));


        // load the IFrame Player API code asynchronously
        var ytscript = document.createElement('script');
        ytscript.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(ytscript, firstScriptTag);

        this.player = null;
        this.settings = {playing: false, volume: 100}
        this.playerReady = false;
    }

    /**
     *  The API calls this function when the video player is ready
     */
    onPlayerReady() {
        ytPlayerInstance.playerReady = true;
        ytPlayerInstance.setVolume(100);

        if (ytPlayerInstance.settings.playing) {
            ytPlayerInstance.play();
        }
    }

    /**
     * Called by the Youtube API if the player state changes
     * @param event {object}
     */
    onPlayerStateChange(event) {
        // unload the player if the video ended
        if (event.data == YT.PlayerState.ENDED) {
            ytPlayerInstance.stop();
            Central.getPlayer().nextSong();
            // update the pause/play button if pause was pressed in the iframe
        } else if (event.data == YT.PlayerState.PAUSED) {
            ytPlayerInstance.settings.playing = false;
            var song = Central.getPlayer().getCurrentSong();
            Central.getPlayer().getPlayQueue().notifyListeners(song);
            // update the pause/play button if play was pressed in the iframe
        } else if (event.data == YT.PlayerState.PLAYING) {
            ytPlayerInstance.settings.playing = true;
            var song = Central.getPlayer().getCurrentSong();
            Central.getPlayer().getPlayQueue().notifyListeners(song);
        }


    }

    /**
     * Pauses the song
     * @override
     */
    pause() {
        this.settings.playing = false;
        if (this.player != null && this.playerReady) {
            this.player.pauseVideo();
        }
    }

    /**
     * Plays the song
     * @override
     */
    play() {
        this.settings.playing = true;
        if (this.player != null && this.playerReady) {
            this.player.playVideo();
        }
    }

    /**
     * Loads a song
     * @param videoid {string}
     * @override
     */
    load(videoid) {
        if (this.player != null) {
            $("#yt-frame").show();
            this.player.loadVideoById(videoid);

        } else {
            this.playerReady = false;
            this.player = new YT.Player('yt-frame', {
                //default 640x360
                height: '180',
                width: '320',
                videoId: videoid,
                playerVars: {'autoplay': 0, 'controls': 1},
                events: {
                    'onReady': this.onPlayerReady,
                    'onStateChange': this.onPlayerStateChange,
                    'onError': function (err) {
                        var errStr = "" + err;
                        if (err == 2) errStr = "invalid videoId";
                        if (err == 100) errStr = "video removed by user";
                        if (err == 101 || err == 150) errStr = "embedding video not allowed"
                        Log.error("Youtube: " + errStr);
                    }
                }
            });
        }
    }

    /**
     * Stops and unloads the player
     * @override
     */
    stop() {
        if (this.playerReady && this.player != null) {
            this.player.stopVideo();

        }
        $("#yt-frame").hide();
        this.settings.playing = false;
    }

    /**
     * Sets the volume
     * @param percent {number} 0-100
     * @override
     */
    setVolume(percent) {
        if (this.playerReady) {
            this.player.setVolume(percent);
        }
        this.settings.volume = percent;
    }

    /**
     * Returns the current time of the song
     * @return {number} in seconds
     */
    getTime() {
        if (this.playerReady) {
            return this.player.getCurrentTime();
        } else {
            return 0;
        }
    }

    /**
     * Returns the duration of the current song
     * @return {number} in seconds
     */
    getDuration() {
        if (this.playerReady) {
            return this.player.getDuration();
        } else {
            return 0;
        }
    }

    // TODO: tryLoadSource
}

ytPlayerInstance = new YoutubePlayer();

/**
 * Called by the Youtube API when it is ready to load videos
 */
function onYouTubeIframeAPIReady() {
    Central.getPlayer().addPlugin(ytPlayerInstance);
}


/**
 * BaseUrlPreview for Youtube URLs
 * see /js/models/PluginBase for more details
 */
class YoutubePreview extends BaseUrlPreview {
    /**
     * @constructor
     */
    constructor() {
        super("youtube");
    }

    /**
     * Checks if the url is a youtube url
     * @param url {string}
     * @return {boolean}
     */
    supportsUrl(url) {
        if (url.search("youtube.com\/watch") >= 0) return true;
        if (url.search("youtu.be") >= 0) return true;
    }

    /**
     * Loads a preview image into a jQuery HTMLElement and calls the callback with the song data.
     * @param element {HTMLElement} jQuery HTMLElement or id
     * @param url {string} youtube video url
     * @param callback {function(Object)}
     */
    preview(element, url, callback) {
        this.element = $(element);
        let videoid = "";

        if (url.startsWith("www")) {
            url = "https://" + url;
        }
        if (url.startsWith("http://")) {
            url = "https://" + url.substring(7);
        }

        if (url.search("youtube.com/watch") >= 0) {
            videoid = getParameterByName("v", url);
        } else {
            let split = url.split(".be/");
            videoid = split[1];
        }
        const title = $('<div>loading title...</div>');
        title.appendTo(this.element);

        // load the title image of the video
        const imgUrl = "http://img.youtube.com/vi/" + videoid + "/0.jpg";
        const img = $('<img src="' + imgUrl + '"/>');
        img.appendTo(this.element);

        // Load the html of the page using the backend
        LocalComm.newMessage({command: "get url", url: url},
            Message.Components.GUI, function (data) {
                if (typeof data.answer !== 'undefined' && data.answer !== null) {
                    let html = data.answer;
                    // TODO: remove everything but the header (rest is not needed)
                    const doc = document.implementation.createHTMLDocument('yt');
                    doc.documentElement.innerHTML = html;

                    let vidname = doc.title;
                    // remove " - YouTube"
                    title.html(vidname.substring(0, vidname.length - 10));

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

                    let song = {title: vidname, type: "youtube", value: videoid};
                    let split = vidname.split("-");
                    if (split.length >= 2) {
                        song.artist = split[0].trim();
                        song.title = split[1].trim();
                    }

                    callback(song);
                } else {
                    Log.error("Youtube: invalid answer from GUI: " + JSON.stringify(data));
                }
            });
    }
}

Central.getUrlPreview().addPlugin(new YoutubePreview());



