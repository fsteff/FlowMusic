/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

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


var mouseX = 0;
var mouseY = 0;

jQuery(document).ready(function () {
    $(document).mousemove(function (e) {
        var bodyOffsets = document.body.getBoundingClientRect();
        mouseX = e.pageX - bodyOffsets.left;
        mouseY = e.pageY;
    });
})

var Config = null;
$.getJSON("./js/config.json", function(json) {
    Config = json;

    for(var i = 0; i < Config.plugins.length; i++){
        var plugin = Config.plugins[i];
        var s = document.createElement("script");
        s.async = false;
        s.defer = false;
        s.type = "text/javascript";
        s.src = "./js/plugins/"+plugin;
        //$("head").append(s);
        document.head.appendChild(s);
        Log.info("Loading plugin: " + plugin);
    };

});

function log(msg, type){
    if(type == null){
        type = "warning";
    }
    var consoleMsg = "["+type.toUpperCase()+"] "+msg;
    switch(type){
        case "info":
            console.info(consoleMsg);
            break;
        case "debug":
            console.log(consoleMsg);
            break;
        case "warning":
            console.warn(consoleMsg);
            break;
        case "error":
            console.error(consoleMsg);
            break;
        default:
            console.warn(consoleMsg);
            type="warning";
            break;
    }

    Log.post(msg, type);
}

function Log(){}
Log.info = function(msg){
    log(msg, "info");
}
Log.debug = function(msg){
    log(msg, "debug");
}
Log.warning = function(msg){
    log(msg, "warning");
}
Log.error = function(msg){
    log(msg, "error");
}

Log.post = function(msg, type){
    $.post("/log", {msg: msg, level: type.toUpperCase()});
}



