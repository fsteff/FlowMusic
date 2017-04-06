function extend(base, sub, baseargs, subargs) {
    var c = new sub(subargs);
    var b = new base(baseargs);
    $.extend(b, c);
    return b;
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

//--------------------------------------------- CLASS BaseSearchEngine --------------------------------------

BaseSearchEngine = function(name){
    this.name = name;
}

BaseSearchEngine.prototype.search = function(query){
    return {};
}
