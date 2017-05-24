/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

function extend(base, sub, baseargs, subargs) {
    var c = new sub(subargs);
    var b = new base(baseargs);
    $.extend(b, c);
    return b;
}

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

function BaseMusicPlayer(name) {
    this.name = name;
    this.settings = null;
}

BaseMusicPlayer.prototype.getName = function(){
    return this.name;
}
BaseMusicPlayer.prototype.play = function () {
    this.settings.playing = true;
}
BaseMusicPlayer.prototype.pause = function () {
    this.settings.playing = false;
}
BaseMusicPlayer.prototype.load = function (source) {
}

BaseMusicPlayer.prototype.playing = function(){
    return this.settings.playing;
}

BaseMusicPlayer.prototype.setVolume = function (volume) {
    this.settings.volume = volume;
}
BaseMusicPlayer.prototype.getVolume = function () {
    return this.settings.volume;
}
BaseMusicPlayer.prototype.getTime = function () {
    return 0;
}
BaseMusicPlayer.prototype.getDuration = function () {
    return 0;
}
BaseMusicPlayer.prototype.stop = function(){
    this.settings.playing = false;
}

BaseMusicPlayer.prototype.tryLoadSource = function(source, callback){
    callback(true);
}
//--------------------------------------------- CLASS BaseSearchEngine --------------------------------------

BaseSearchEngine = function(name){
    this.name = name;
}

BaseSearchEngine.prototype.search = function(query, callback){
    callback({});
}

//--------------------------------------------- CLASS BaseUrlPreview ----------------------------------------

BaseUrlPreview = function(name){
    this.name = name;
}

BaseUrlPreview.prototype.supportsUrl = function(url){
    return false;
}

BaseUrlPreview.prototype.preview = function(element, url, callback){
    $(element).html("base url preview: " + url);
    callback({title: "nodidea", artist: "noidea"});
}