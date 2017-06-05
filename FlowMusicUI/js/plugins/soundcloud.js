/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 *
 * Note to this file: this is ECMAScript 6
 * Only modern browsers support this!
 */

// load the soundcloud api
var scr = document.createElement('script'),
    head = document.head || document.getElementsByTagName('head')[0];
scr.async = false;
scr.type = "text/javascript";
scr.src = "https://w.soundcloud.com/player/api.js";
head.insertBefore(scr, head.firstChild);

var soundCloudInstance;

/**
 * BaseMusicPlayer for Soundcloud
 */
class SoundCloudPlayer extends BaseMusicPlayer{
    /**
     * @constructor
     * @param name {string} plugin name (
     */
    constructor() {
        super("soundcloud")
        const self = this;
        this.settings = {playing: false, volume: 100}
        this.widget = null;
        this.ready = false;
        this.time = 0;
        this.duration = 0;
        this.stopped = false;
        this.loadLater = null;
        // create and load the iframe
        this.element = $('<iframe id="soundcloud-frame"'
            + 'class="iframe"'
            + 'width="320px"'
            + 'height="180px"'
            + 'scrolling="no"'
            + 'frameborder="no"'
                // have to load an arbitrary song first...
            + 'src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/' +
            'dj-toxic-waste/freedom-2k14-original-mix">');
        this.element.appendTo("body");


        var widgetIframe = document.getElementById('soundcloud-frame');
        const seconds = new Date().getTime() / 1000;

        /**
         * Load the player (can only be done after soundcloud api is finished loading)
         * (-> dirty bugfix, but it seems there is no other way...)
         */
        const load = function(){
            if(typeof SC == 'undefined' || SC == null){
                if(seconds + 5 < (new Date().getTime() / 1000)){
                    Log.error("could not load soundcloud api");
                    return;
                }
                window.setTimeout(load, 500);
            }else {
                soundCloudInstance.widget = SC.Widget(widgetIframe);

                soundCloudInstance.ready = false;
                soundCloudInstance.widget.bind(SC.Widget.Events.READY, function () {
                    soundCloudInstance.ready = true;
                    soundCloudInstance.setVolume(soundCloudInstance.settings.volume);
                    if (soundCloudInstance.settings.playing) {
                        soundCloudInstance.play();
                    }
                    Central.getPlayer().addPlugin(soundCloudInstance);
                    soundCloudInstance.widget.unbind(SC.Widget.Events.READY);
                });

                soundCloudInstance.widget.bind(SC.Widget.Events.FINISH, function () {
                    Central.getPlayer().nextSong();
                })
                self.element.hide();
            }
        }
        window.setTimeout(load, 100);

    }

    /**
     * Play the currently loaded song
     * @override
     */
    play() {
        this.settings.playing = true;
        if (this.ready) {
            this.widget.play();
        }
    }

    /**
     * Pause the current song
     * @override
     */
    pause() {
        this.settings.playing = false;
        if (this.ready) {
            this.widget.pause();
        }
    }

    /**
     * Load a soundcloud URL
     * @param url {string}
     * @override
     */
    load(url) {
        // first has to finish loading the last song -> if not, this is done later
        if (this.ready) {
            // player settings
            url += '&amp;auto_play=false&amp;liking=false&amp;buying=false&amp;sharing=false&amp;'
                + 'hide_related=true&amp;show_comments=false&amp;download=false&amp;'
                + 'show_user=false&amp;show_reposts=false&amp;visual=true';

            this.ready = false;
            this.stopped = false;

            // unload old listeners
            this.widget.unbind(SC.Widget.Events.READY);
            this.widget.unbind(SC.Widget.Events.PAUSE);
            this.widget.unbind(SC.Widget.Events.PLAY);

            soundCloudInstance.element.show();
            this.widget.load(url);

            this.widget.bind(SC.Widget.Events.READY, function () {
                soundCloudInstance.ready = true;

                // if between loading and the ready event an other song was loaded, load this one
                if(soundCloudInstance.loadLater != null){
                    soundCloudInstance.load(soundCloudInstance.loadLater);
                    soundCloudInstance.loadLater = null;
                    return;
                }
                if(soundCloudInstance.stopped){
                    soundCloudInstance.element.hide();
                    return;
                }

                soundCloudInstance.setVolume(soundCloudInstance.settings.volume);
                if (soundCloudInstance.settings.playing) {
                    soundCloudInstance.play();
                }
                // get the duration of the new song
                soundCloudInstance.widget.getDuration(function(aw){
                    soundCloudInstance.duration = aw/1000;
                });

                const getTime = function(aw){
                    soundCloudInstance.time = aw/1000;
                }

                // check the time of the song every second
                const checkTime = function(){
                    if(soundCloudInstance.ready){
                        soundCloudInstance.widget.getPosition(getTime);
                        window.setTimeout(checkTime, 1000);
                    }
                }
                checkTime();
            });

            // if the pause button inside the widget is clicked, also reset the pause button of the player
            this.widget.bind(SC.Widget.Events.PAUSE, function(){
                soundCloudInstance.settings.playing = false;
                var song = Central.getPlayer().getCurrentSong();
                Central.getPlayer().getPlayQueue().notifyListeners(song);
            });

            this.widget.bind(SC.Widget.Events.PLAY, function(){
                soundCloudInstance.settings.playing = true;
                var song = Central.getPlayer().getCurrentSong();
                Central.getPlayer().getPlayQueue().notifyListeners(song);
            })

        }else{ // if not ready, load later
            this.loadLater = url;
            this.element.show();
        }
    }

    /**
     * Stop the player and hide it
     * @override
     */
    stop() {
        this.settings.playing = false;
        this.widget.pause();
        this.element.hide();
        this.stopped = true;
    }

    /**
     * Set the volume
     * @param volume {number} 0-100
     * @override
     */
    setVolume(volume) {
        if (this.ready) {
            this.widget.setVolume(volume);
            this.settings.volume = volume;
        }
    }

    /**
     * Get the current time of the song
     * @return {number} in sectonds
     * @override
     */
    getTime() {
        return this.time;
    }

    /**
     * Get the duration of the current song
     * @return {number} in seconds
     * @override
     */
    getDuration() {
        return this.duration;
    }

    // TODO: tryLoadSource
}

soundCloudInstance = new SoundCloudPlayer();


/**
 * BaseUrlPreview for Soundcloud URLs
 * see /js/models/PluginBase.js for more detail
 */
class SoundCloudPreview extends BaseUrlPreview {
    /**
     * @constructor
     */
    constructor(){
        super("soundcloud");
    }

    /**
     * Checks if the url contains "soundcloud.com"
     * @param url {string}
     * @return {boolean} supported or not
     */
    supportsUrl(url) {
        return (url.search("soundcloud.com") >= 0);
    }

    /**
     * Previews an URL inside an jQuery HTMLElement
     * @param element {HTMLElement} jQuery HTMLElement to render into
     * @param url {string}
     * @param callback {function(object)}
     */
    preview(element, url, callback) {
        const self = this;
        this.element = element;

        if (url.startsWith("www")) {
            url = "https://" + url;
        }
        if (url.startsWith("http://")) {
            url = "https://" + url.substring(7);
        }

        const iframe = $('<iframe '
            + 'width="400px" '
            + 'height="200px" '
            + 'scrolling="no" '
            + 'frameborder="no" '
            + 'src="https://w.soundcloud.com/player/?url='
            + url
            + '&amp;auto_play=false&amp;liking=false&amp;buying=false&amp;sharing=false&amp;'
            + 'hide_related=true&amp;show_comments=false&amp;download=false&amp;'
            + 'show_user=false&amp;show_reposts=false&amp;visual=true"></iframe>');

        const title = $('<div>loading title...</div>');
        title.appendTo(this.element);
        iframe.appendTo(this.element);

        // Load the html of the page using the backend
        LocalComm.newMessage({command: "get url", url: url},
            Message.Components.GUI, function (data) {
                if (typeof data.answer !== 'undefined' && data.answer !== null) {
                    var html = data.answer;
                    // TODO: remove everything but the header (rest is not needed)
                    const doc = document.implementation.createHTMLDocument('sc');
                    doc.documentElement.innerHTML = html;

                    var trackname = doc.title;
                    var pos = 0;
                    // remove "by user | Listen on Soundcloud"
                    for (var i = trackname.length; i > 0 && pos == 0; i--) {
                        if (trackname.charAt(i) == 'y' && trackname.charAt(i - 1) == 'b') {
                            pos = i - 1;
                        }
                    }
                    trackname = trackname.substring(0, pos);

                    title.html(trackname);

                    var song = {title: trackname, type: "soundcloud", value: url};
                    var split = trackname.split("-");
                    if (split.length >= 2) {
                        song.artist = split[0].trim();
                        song.title = split[1].trim();
                    }

                    callback(song);
                } else {
                    Log.error("SoundCloud: invalid answer from GUI: " + JSON.stringify(data));
                }
            });
    }
}

Central.getUrlPreview().addPlugin(new SoundCloudPreview());
