/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

/**
 * Helper function to simulate "extends"
 * This instantiates to classes of type base and sub and extends base by sub
 * @param base {function} base class
 * @param sub {function} child class
 * @param baseargs {*} argument for the constructor of the first class
 * @param subargs {*} argument for the constructor of the second class
 * @return {*} base extended by sub
 */
function extend(base, sub, baseargs, subargs) {
    var c = new sub(subargs);
    var b = new base(baseargs);
    $.extend(b, c);
    return b;
}

/**
 * extracts an HTTP get parameter of the given url
 * @param name {string} parameter name
 * @param url {string} URL
 * @return {*}
 */
function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

//----------------------------------------------- CLASS BaseMusicPlayer --------------------------------
/**
 * The base class for music player plugins
 * @param name {string} plugin name
 * @constructor
 */
function BaseMusicPlayer(name) {
    this.name = name;
    this.settings = null;
}
/**
 * getter for the plugin name
 * @return {string}
 */
BaseMusicPlayer.prototype.getName = function(){
    return this.name;
}
/**
 * Play the song
 */
BaseMusicPlayer.prototype.play = function () {
    this.settings.playing = true;
}
/**
 * Pause the song
 */
BaseMusicPlayer.prototype.pause = function () {
    this.settings.playing = false;
}
/**
 * Load a song
 * @param source {*} source value, type depends on the plugin
 */
BaseMusicPlayer.prototype.load = function (source) {
}
/**
 * Returns true if the player is currently playing or false if it is paused or stopped
 * @return {boolean}
 */
BaseMusicPlayer.prototype.playing = function(){
    return this.settings.playing;
}
/**
 * Set the volume (currently unused)
 * @param volume {number} 0-100
 */
BaseMusicPlayer.prototype.setVolume = function (volume) {
    this.settings.volume = volume;
}
/**
 * @return {number} volume (0-100)
 */
BaseMusicPlayer.prototype.getVolume = function () {
    return this.settings.volume;
}
/**
 * Returns the current time position of the played song
 * @return {number} in seconds
 */
BaseMusicPlayer.prototype.getTime = function () {
    return 0;
}
/**
 * Returns the duration of the current song
 * @return {number} in seconds
 */
BaseMusicPlayer.prototype.getDuration = function () {
    return 0;
}
/**
 * Stops the player (and unloads the song, depends on the plugin)
 */
BaseMusicPlayer.prototype.stop = function(){
    this.settings.playing = false;
}
/**
 * Tries to load a source (if the plugin supports it)
 * @param source {*}
 * @param callback {function(boolean)} callback handler
 */
BaseMusicPlayer.prototype.tryLoadSource = function(source, callback){
    callback(true);
}
//--------------------------------------------- CLASS BaseSearchEngine --------------------------------------
/**
 * Base class for a search plugin
 * @param name {string} plugin name
 * @constructor
 */
BaseSearchEngine = function(name){
    this.name = name;
}
/**
 * Searches songs that match the query (is called by SearchEngine (see Central))
 * @param query {string}
 * @param callback {function(SongArray)} callback handler
 */
BaseSearchEngine.prototype.search = function(query, callback){
    callback(new SongArray([]));
}

//--------------------------------------------- CLASS BaseUrlPreview ----------------------------------------
/**
 * Base class for UrlPreview plugins.
 * (These are used by the AddSong view)
 * @param name {string} plugin name
 * @constructor
 */
BaseUrlPreview = function(name){
    this.name = name;
}
/**
 * True if the plugins supports the given url, false if not
 * @param url {string}
 * @return {boolean} url supported
 */
BaseUrlPreview.prototype.supportsUrl = function(url){
    return false;
}
/**
 * Loads a preview into a jQuery HTMLElement and calls the callback with the song data.
 * @param element {HTMLElement}
 * @param url {string} URL
 * @param callback {function(Object)} parameter is of the form
 * {title: ..., artist: ... ,type: "...", value: ...}
 */
BaseUrlPreview.prototype.preview = function(element, url, callback){
    $(element).html("base url preview: " + url);
    callback({title: "nodidea", artist: "noidea", type: this.name, value: null});
}