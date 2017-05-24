/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */


var scr = document.createElement('script'),
    head = document.head || document.getElementsByTagName('head')[0];
scr.async = false;
scr.type = "text/javascript";
scr.src = "https://w.soundcloud.com/player/api.js";
head.insertBefore(scr, head.firstChild);

var soundCloudInstance = null;

function SoundCloudPlayer() {
    const self = this;
    this.settings = {playing: false, volume: 100}
    this.widget = null;
    this.ready = false;
    this.time = 0;
    this.duration = 0;

    this.element = $('<iframe id="soundcloud-frame"'
        + 'class="iframe"'
        + 'width="300px"'
        + 'height="200px"'
        + 'scrolling="no"'
        + 'frameborder="no"'
            // throws an error, but works anyway - can´t find a fix for it
        + 'src="https://w.soundcloud.com/player/?url=http://api.soundcloud.com/">');
    this.element.appendTo("body");


    var widgetIframe = document.getElementById('soundcloud-frame');
    const seconds = new Date().getTime() / 1000;

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
            });

            soundCloudInstance.widget.bind(SC.Widget.Events.FINISH, function () {
                Central.getPlayer().nextSong();
            })
            self.element.hide();
        }
    }
    window.setTimeout(load, 100);

}

SoundCloudPlayer.prototype.play = function () {
    this.settings.playing = true;
    if (this.ready) {
        this.widget.play();
    }
}
SoundCloudPlayer.prototype.pause = function () {
    this.settings.playing = false;
    if (this.ready) {
        this.widget.pause();
    }
}
SoundCloudPlayer.prototype.load = function (url) {
    if (this.ready) {
        this.settings.playing = false;
        url += '&amp;auto_play=false&amp;liking=false&amp;buying=false&amp;sharing=false&amp;'
            + 'hide_related=true&amp;show_comments=false&amp;download=false&amp;'
            + 'show_user=false&amp;show_reposts=false&amp;visual=true';

        this.ready = false;
        this.widget.load(url);
        this.widget.bind(SC.Widget.Events.READY, function () {
            soundCloudInstance.ready = true;
            soundCloudInstance.setVolume(soundCloudInstance.settings.volume);
            if (soundCloudInstance.settings.playing) {
                soundCloudInstance.play();
            }
            soundCloudInstance.element.show();
            soundCloudInstance.widget.getDuration(function(aw){
               soundCloudInstance.duration = aw/1000;
            });

            const getTime = function(aw){
                soundCloudInstance.time = aw/1000;
            }

            const checkTime = function(){
                if(soundCloudInstance.ready){
                    soundCloudInstance.widget.getPosition(getTime);
                    window.setTimeout(checkTime, 1000);
                }
            }
            checkTime();
        });

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

    }
}
SoundCloudPlayer.prototype.stop = function () {
    this.settings.playing = false;
    this.widget.pause();
    this.element.hide();
}
SoundCloudPlayer.prototype.setVolume = function (volume) {
    if (this.ready) {
        this.widget.setVolume(volume);
        this.settings.volume = volume;
    }
}
SoundCloudPlayer.prototype.getTime = function(){
    return this.time;
}

SoundCloudPlayer.prototype.getDuration = function(){
    return this.duration;
}

SoundCloudPlayer.prototype.tryLoadSource = function(source, callback){
    callback(true);
}

soundCloudInstance = extend(BaseMusicPlayer, SoundCloudPlayer, "soundcloud");


function SoundCloudPreview(){

}

SoundCloudPreview.prototype.supportsUrl = function(url){
    return (url.search("soundcloud.com") >= 0);
}

SoundCloudPreview.prototype.preview = function(element, url, callback){
    const self = this;
    this.element = element;
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

    LocalComm.newMessage({command: "get url",url: url},
        Message.Components.GUI, function(data){
            if(typeof data.answer !== 'undefined' && data.answer !== null){
                var html = data.answer;
                // todo remove scripts from html
                const doc = document.implementation.createHTMLDocument('sc');
                doc.documentElement.innerHTML = html;

                var trackname = doc.title;
                var pos = 0;
                // remove "by user | Listen on Soundcloud"
                for(var i = trackname.length; i > 0 && pos == 0; i--){
                    if(trackname.charAt(i) == 'y' && trackname.charAt(i-1) == 'b'){
                        pos = i-1;
                    }
                }
                trackname = trackname.substring(0, pos);

                title.html(trackname);

                var song = {title: trackname, type: "soundcloud", value: url};
                var split = trackname.split("-");
                if(split.length >= 2){
                    song.artist = split[0].trim();
                    song.title = split[1].trim();
                }

                callback(song);
            }
        });
}

Central.getUrlPreview().addPlugin(extend(BaseUrlPreview, SoundCloudPreview, "soundcloud"));
