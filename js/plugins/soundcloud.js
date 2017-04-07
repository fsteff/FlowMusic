// TODO: Soundcloud API throws error on load!

var scr = document.createElement("script");

//scr.async = false;
//scr.defer = false;
//scr.type = "text/javascript";
scr.src = "https://w.soundcloud.com/player/api.js";
//$("head").append(s);
document.head.appendChild(scr);

WaitForSoundcloud();

function WaitForSoundcloud() {
    if (typeof SC == "undefined") {
        setTimeout(WaitForSoundcloud, 500);
    } else {

        var soundCloudInstance = null;

        function SoundCloudPlayer() {
            const self = this;
            this.settings = {playing: false, volume: 100}


            this.element = $('<iframe id="soundcloud-frame" scrolling="no" frameborder="no"></iframe>');
            this.element.appendTo("body");

            this.element.hide();

            var widgetIframe = document.getElementById('soundcloud-frame');
            this.widget = SC.Widget(widgetIframe);

            this.ready = false;
            this.widget.bind(SC.Widget.Events.READY, function () {
                self.ready = true;
                self.setVolume(100);
                if (self.settings.playing) {
                    self.play();
                }
                Central.getPlayer().addPlugin(soundCloudInstance);
            });

            this.widget.bind(SC.Widget.Events.FINISH, function () {
                Central.getPlayer().nextSong();
            })

        }

        SoundCloudPlayer.prototype.play = function () {
            if (this.ready) {
                this.settings.playing = true;
                this.widget.play();
            }
        }
        SoundCloudPlayer.prototype.pause = function () {
            if (this.ready) {
                this.settings.playing = false;
                this.widget.pause();
            }
        }
        SoundCloudPlayer.prototype.load = function (url) {
            if (this.ready) {
                this.settings.playing = false;
                this.widget.load(url);
                this.element.show();
            }
        }
        SoundCloudPlayer.prototype.stop = function () {
            if (this.ready) {
                this.settings.playing = false;
                this.element.hide();
            }
        }
        SoundCloudPlayer.prototype.setVolume = function (volume) {
            if (this.ready) {
                this.widget.setVolume(volume);
                this.settings.volume = volume;
            }
        }

        soundCloudInstance = extend(BaseMusicPlayer, SoundCloudPlayer, "soundcloud");


    }
}

// https://w.soundcloud.com/player/api.js
