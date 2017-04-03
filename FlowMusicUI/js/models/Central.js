//----------------------------------------------- CLASS Playlist ---------------------------------------
function Playlist() {
    this.songs = [];
    this.listeners = [];
    this.currentPos = 0;
    this.history = [];
}

Playlist.prototype.next = function (random) {
    if(this.songs.length > this.currentPos && this.songs[this.currentPos] != null) {
        this.history.push(this.songs[this.currentPos]);
        while (this.history.length > 10) {
            this.history.shift();
        }
    }

    if (random) {
        this.currentPos = Math.round(Math.random() * this.songs.length) % this.songs.length;
    } else {
        if (this.songs.length <= this.currentPos + 1) {
            return null;
        } else {
            this.currentPos++;
        }
    }
    this.notifyListeners(this.songs[this.currentPos]);

    return this.songs[this.currentPos];
}

Playlist.prototype.prev = function(){
    if(this.history.length > 0) {
        this.currentPos = this.songs.indexOf(this.history[this.history.length-1]);
        this.history.pop();
    }

    this.notifyListeners(this.songs[this.currentPos]);
    return this.songs[this.currentPos];
}

Playlist.prototype.add = function (song) {
    var actual = song;
    if(Object.prototype.toString.call( song ) === '[object Array]' ){
        actual = song[0];
        for(var i = 0; i < song.length; i++){
            this.songs.push(song[i]);
        }
    }else{
        this.songs.push(song);
    }

    this.notifyListeners(actual);
}

Playlist.prototype.addNew = function(artist, title, plugin, source){
    var song = {
        artist: artist,
        title: title,
        plugin: plugin,
        source: source
    };
    this.add(song);
}

Playlist.prototype.current = function () {
    if(this.songs.length == 0){
        return null;
    }else {
        return this.songs[this.currentPos];
    }
}

Playlist.prototype.getSongs = function(){
    return this.songs;
}

Playlist.prototype.addListener = function(listener){
    this.listeners.push(listener);
    if(this.current() != null){
        listener(this.current());
    }
}

Playlist.prototype.removeListener = function(object){
    this.listeners.remove(object);
}

Playlist.prototype.notifyListeners = function(song){
    for(var i = 0; i < this.listeners.length; i++){
        if(typeof this.listeners[i] === "function"){
            this.listeners[i](song);
        }
    }
}



//----------------------------------------------- CLASS PlayerSettings ---------------------------------

function PlayerSettings() {
}
PlayerSettings.prototype = {
    volume: 100,
    playing: false
}


//----------------------------------------------- CLASS MusicPlayer -------------------------------------

function MusicPlayer() {
    this.currentPlayer = null;
    this.playlist = null;
    this.currentSong = null;

    this.settings = new PlayerSettings();
    this.players = [];

    this.playlist = new Playlist();

    this.currentSong = this.playlist.current();
    this.currentPlayer = null;

}

MusicPlayer.prototype.getCurrentPlayer = function () {
    return this.currentPlayer;
}
MusicPlayer.prototype.getCurrentSong = function () {
    return this.currentSong;
}

MusicPlayer.prototype.addPlugin = function (player) {
    player.settings = this.settings;
    this.players.push(player);
    this.currentSong = this.playlist.current();
    if(this.currentSong != null) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.currentSong.plugin == this.players[i].getName()) {
                this.currentPlayer = this.players[i];
            }
        }
        this.currentPlayer.load(this.currentSong.source);
    }
}

MusicPlayer.prototype.nextSong = function () {
    this.currentSong = this.playlist.next();

    if(this.currentSong != null) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.currentSong.plugin === this.players[i].getName()) {
                this.currentPlayer = this.players[i];
            }
        }
    }

    this.currentPlayer.load(this.currentSong.source);
    this.currentPlayer.play();
}

MusicPlayer.prototype.getPlaylist = function(){
    return this.playlist;
}
// ---------------------------------------------- CLASS CENTRAL -----------------------------------------
function Central() {
    this.player = new MusicPlayer();
    return this;
}

Central.instance = null;

Central.getInstance = function () {
    if (Central.instance === null) {
        Central.instance = new Central();
    }
    return Central.instance;
}

Central.getPlayer = function () {
    return Central.getInstance().player;
}



