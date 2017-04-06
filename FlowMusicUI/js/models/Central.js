
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
        if (this.songs.length == 0) {
            return null;
        } else {
            this.currentPos = ((this.currentPos+1) % this.songs.length);
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

    this.notifyListeners(this.current());
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
    if(this.songs.length == 0 || this.songs.length <= this.currentPos){
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

Playlist.prototype.getSongNr = function(artist, title){
    var nr = 0;
    var found = false;
    for(; nr < this.songs.length && !found; nr++){
        if(this.songs[nr].artist == artist && this.songs[nr].title == title){
            return nr;
        }
    }
}

Playlist.prototype.getNr = function (nr) {
    if(nr < this.songs.length){
        return this.songs[nr];
    }
}

Playlist.prototype.playSong = function(song){
    const nr = this.getSongNr(song.artist, song.title);
    if(nr < this.songs.length){
        this.currentPos = nr;
        this.notifyListeners(this.songs[this.currentPos]);
    }
    return this.current();
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
        if(this.currentPlayer != null) {
            this.currentPlayer.load(this.currentSong.source);
        }
    }
}

MusicPlayer.prototype.playSong = function (song) {
    if(song.source == null || song.plugin == null){
        song = this.playlist.playSong(song);
    }

    this.currentSong = song;
    if(this.currentPlayer != null){
        this.currentPlayer.stop();
    }

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

MusicPlayer.prototype.nextSong = function () {
    this.currentSong = this.playlist.next();
    this.playSong(this.currentSong);
}
MusicPlayer.prototype.lastSong = function () {
    this.currentSong = this.playlist.prev();
    this.playSong(this.currentSong);
}

MusicPlayer.prototype.getPlaylist = function(){
    return this.playlist;
}


// ---------------------------------------------- CLASS SearchEngine ------------------------------------

function SearchEngine(){
    this.plugins = [];
}

SearchEngine.prototype.addPlugin = function(plugin){
    this.plugins.push(plugin);
}

SearchEngine.prototype.search = function(query){
    var results = [];

    for(var i = 0; i < this.plugins.length; i++){
        var res = this.plugins[i].search(query);
        for(var i2 = 0; i2 < res.length; i2++){
            results.push(res[i2]);
        }
    }

    // TODO: this may fail, also do tests
    // This removes double entries
    /*
    for(var i = 0; i < results.length; i++){
        for (var i2 = 0; i2 < results.length; i2++){
            if(i != i2 && results[i].title == results[i2].title && results[i].artist == results[i2].artist){
                var entry = results[i2];
                results.splice(i2, 1);
                for(var i3 = 0; i3 < entry.sources.length; i3++){
                    results[i].sources.push(entry.sources[i3]);
                }
            }
        }
    }
    */
    return results;
}

// ---------------------------------------------- CLASS Verifier -------------------------------------------------------

function Verifier(){
    this.plugins = [];
}

Verifier.prototype.addPlugin = function(plugin){
    this.plugins.push(plugin);
}

Verifier.prototype.verify = function(url){
    var results = [];
    for(var i = 0; i < this.plugins.length; i++){
        var res = this.plugins[i].verify(url);
        if(res != null){
            results.push(res);
        }
    }
    return results;
}

// ---------------------------------------------- CLASS CENTRAL --------------------------------------------------------
function Central() {
    this.verifier = new Verifier();
    this.player = new MusicPlayer();
    this.search = new SearchEngine();
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

Central.getSearch = function(){
    return Central.getInstance().search;
}

Central.getVerifier = function(){
    return Central.getInstance().verifier;
}

