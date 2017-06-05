/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

var mouseX = 0;
var mouseY = 0;

// listen to mouse moves
jQuery(document).ready(function () {
    $(document).mousemove(function (e) {
        var bodyOffsets = document.body.getBoundingClientRect();
        mouseX = e.pageX - bodyOffsets.left;
        mouseY = e.pageY;
    });
})

/**
 * Loads the config from config.json
 * @constructor
 */
function Config(){
    const self = this;
    this.plugins = [];
    $.getJSON("./js/config.json", function(config) {
        for(var i = 0; i < config.plugins.length; i++){
            var plugin = config.plugins[i];
            if(typeof plugin.name === 'string' && typeof plugin.src ==='string'){
                self.plugins.push(plugin);
                var s = document.createElement("script");
                s.async = false;
                s.defer = false;
                s.type = "text/javascript";
                s.src = "./js/plugins/"+plugin.src;
                document.head.appendChild(s);
                Log.info("Loading plugin: " + plugin);
            }else{
                Log.error("config.json invalid: " + JSON.stringify(plugin));
            }
        };
    });

    return this;
}

Config.instance = null;

/**
 * Get the singleton instance
 * @return {Config}
 */
Config.getInstance = function(){
    if(Config.instance === null){
        Config.instance = new Config();
    }
    return Config.instance;
}

// load the instance to load the plugins instantly
Config.getInstance();

/**
 * Compares the rowing of two plugins - the rowing is based on the rowing inside config.json
 * @param first {string} name of the first plugin
 * @param second {string} name of the second plugin
 * @return {number} -1 if the first plugin is to favor, 1 if the second plugin is to favor, or 0 if an error occured
 */
Config.comparePluginRowing = function(first, second){
    const self = Config.getInstance();
    for(let i = 0; i < self.plugins.length; i++){
        if(first === self.plugins[i].name){
            return -1;
        }
        if(second === self.plugins[i].name){
            return 1;
        }
    }
    Log.info("Config.comparePluginRowing: no plugin matches the loaded ones");
    return 0;
}


/**
 * Create a log message that will be printed to the console and into the logfile.
 * Messages longer that 1000 characters will be clipped.
 * @param msg {String}
 * @param type {String} either "info", "debug", "warning" or "error"
 */
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

    Log.post(clipString(msg, 1000), type);
}

/**
 * Class Log with functions for the log levels.
 * @constructor
 */
function Log(){}
/**
 * Log an INFO message
 * @param msg {String}
 */
Log.info = function(msg){
    log(msg, "info");
}
/**
 * Log a DEBUG message
 * @param msg {String}
 */
Log.debug = function(msg){
    log(msg, "debug");
}
/**
 * Log a WARNING message
 * @param msg {String}
 */
Log.warning = function(msg){
    log(msg, "warning");
}
/**
 * Log a ERROR message
 * @param msg {String}
 */
Log.error = function(msg){
    log(msg, "error");
}
/**
 * Writes a message to the logfile
 * @param msg {String}
 * @param type {String} either "info", "debug", "warning" or "error"
 */
Log.post = function(msg, type){
    $.post("/log", {msg: msg, level: type.toUpperCase()});
}

/**
 * Minimalistic Map (Key-Value Storage) implementation
 * @constructor
 */
function Map(){
    this.keys = [];
    this.values = [];
}
/**
 * Add a key-value pair or updates a value if the key is already present
 * @param key {*}
 * @param value {*}
 */
Map.prototype.put = function(key, value){
    var found = false;
    for(var i = 0; i < this.keys.length && ! found; i++){
        if(this.keys[i] === key){
            this.values[i] = value;
            found = true;
        }
    }
    if(! found){
        const index = this.keys.length;
        this.keys[index] = key;
        this.values[index] = value;
    }
}
/**
 * Get a key-value pair from the map
 * @param key
 * @returns {*}
 */
Map.prototype.get = function(key){
    for(var i = 0; i < this.keys.length; i++){
        if(this.keys[i] == key){
            return this.values[i];
        }
    }
    return null;
}
/**
 * Removes a key-value pair
 * @param key
 */
Map.prototype.remove = function(key){
    for(var i = 0; i < this.keys.length; i++){
        if(this.keys[i] === key){
            delete this.keys[i];
        }
    }
}
/**
 * Removes all key-value pairs whose value mathes the value
 * @param value {*}
 * @param comparator {function(a,b)} (optional, can be null)
 */
Map.prototype.removeAll = function(value, comparator){
    if(comparator === null){
        comparator = function(a,b){return a === b};
    }
    for(var i = 0; i < this.keys.length; i++){
        if(comparator(this.values[i], value)){
            delete this.keys[i];
            delete this.values[i];
        }
    }
}


/**
 * An easily compareable function wrapper
 * @param foo {function()} arbitrary function
 * @constructor
 */
function Callable(foo){
    this.call = foo;
    this.id = Callable.idCounter++;
}
/**
 *
 * @param other
 * @returns {boolean}
 */
Callable.prototype.equals = function(other){
    return other.id === this.id;
}

/**
 * Static id counter that is incremented each time an instance is created
 * @type {number}
 */
Callable.idCounter = 0;

/**
 * Checks if an object is an array
 * @param obj
 * @returns {boolean}
 */
function isArray(obj){
    return $.isArray(obj);
}

/**
 * Limits a string to a given length.
 * If the string is longer than max, "..." is added to it
 * @param str {string}
 * @param max {number}
 * @returns {string}
 */
function clipString(str, max){
    var ret = str.substring(0, max);
    if(ret.length == max){
        ret += "...";
    }
    return ret;
}

/**
 * Class for easy background-processing without blocking the UI
 * @param foo {function()}
 * @param maxTime {number} in milliseconds - if the time needed by foo is longer than this, a warning is
 * written to the console
 * @param pauseTime {number} the timeout that is used for UI
 * @constructor
 */
function FakeThread(foo, maxTime, pauseTime){
    this.foo = foo;
    this.maxTime = maxTime;
    this.pauseTime = pauseTime;
}

/**
 * starts the processing
 */
FakeThread.prototype.start = function(){
    const self = this;
    function doStuff() {
        let start = performance.now();
        let done = self.foo();
        let diff = performance.now() - start;
        if(diff > self.maxTime){
            console.warn("FakeThread took longer as supposed");
        }
        if(! done) {
            window.setTimeout(doStuff, self.pauseTime);
        }
    }
    doStuff();
}