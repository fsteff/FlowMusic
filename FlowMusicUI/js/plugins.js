// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.

var Config = null;
$.getJSON("./js/config.json", function(json) {
    Config = json;

    var player = Central.getPlayer();
    player.playlist.add([{
        artist: "Klaas & Niels Van Gogh",
        title: "Resurection (In Space)",
        plugin: "local",
        source: "test.mp3"
    },{
        artist: "Maxim",
        title: "Meine Soldaten",
        plugin: "local",
        source: "test2.mp3"
    }]);

    var head = document.getElementsByTagName('head')[0];
    for(var i = 0; i < Config.plugins.length; i++){
        var plugin = Config.plugins[i];
        var s = document.createElement("script");
        s.async = false;
        s.defer = false;
        s.type = "text/javascript";
        s.src = "./js/"+plugin;
        //$("head").append(s);
        head.append(s);
    };



    /*  this.playlist.add({
     artist: "DJ Toxic Waste",
     title: "Feedom 2k14",
     plugin: "youtube",
     source: "Do7-LR6Mrsg"
     });*/



});
