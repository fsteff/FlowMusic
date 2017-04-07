/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */


//----------------------------------------------- CLASS PlayQueue ---------------------------------------
/**
 * PlayQueue stores and manages the list of songs in the current playlist/queue.
 * The PlayQueue instance is stored by Central - use Central.getPlayQueue() to retrieve it
 * @constructor
 */
function PlayQueue() {
    this.songs = [];
    this.listeners = [];
    this.currentPos = 0;
    this.history = [];
}
/**
 * Play next song in the list (called by MusicPlayer - not for other use!)
 * @param random
 * @returns the new current song
 */
PlayQueue.prototype.next = function (random) {
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
/**
 * Play the last song (called by MusicPlayer - not for other use!)
 * @returns {*}
 */
PlayQueue.prototype.prev = function(){
    if(this.history.length > 0) {
        this.currentPos = this.songs.indexOf(this.history[this.history.length-1]);
        this.history.pop();
    }

    this.notifyListeners(this.songs[this.currentPos]);
    return this.songs[this.currentPos];
}
/**
 * Add a new song to the list
 * @param song in the format {artist:"...",title:"...",plugin:"...",source:"..."}
 * or array of such objects
 */
PlayQueue.prototype.add = function (song) {
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
/**
 * Add a new song to the list
 * @param artist
 * @param title
 * @param plugin
 * @param source
 */
PlayQueue.prototype.addNew = function(artist, title, plugin, source){
    var song = {
        artist: artist,
        title: title,
        plugin: plugin,
        source: source
    };
    this.add(song);
}
/**
 * @returns the current song
 */
PlayQueue.prototype.current = function () {
    if(this.songs.length == 0 || this.songs.length <= this.currentPos){
        return null;
    }else {
        return this.songs[this.currentPos];
    }
}
/**
 * Get a list of all songs
 * @returns {Array}
 */
PlayQueue.prototype.getSongs = function(){
    return this.songs;
}
/**
 * Add a change listener - everytime the queue or the actually played song is changed,
 * all all listeners are called (parameter is the current song)
 * @param listener
 */
PlayQueue.prototype.addListener = function(listener){
    this.listeners.push(listener);
    if(this.current() != null){
        listener(this.current());
    }
}
/**
 * Removes a listener
 * @param the listener function to be removed
 */
PlayQueue.prototype.removeListener = function(object){
    this.listeners.remove(object);
}
/**
 * Calls all listeners
 * @param parameter of these calls
 */
PlayQueue.prototype.notifyListeners = function(song){
    for(var i = 0; i < this.listeners.length; i++){
        if(typeof this.listeners[i] === "function"){
            this.listeners[i](song);
        }
    }
}
/**
 * Get the internal array index of a song with given artist and title
 * @param artist
 * @param title
 * @returns index number
 */
PlayQueue.prototype.getSongNr = function(artist, title){
    var nr = 0;
    var found = false;
    for(; nr < this.songs.length && !found; nr++){
        if(this.songs[nr].artist == artist && this.songs[nr].title == title){
            return nr;
        }
    }
}
/**
 * Get the song of a given index number
 * @param nr
 * @returns song object {artist, title, plugin, source}
 */
PlayQueue.prototype.getSongByNr = function (nr) {
    if(nr < this.songs.length){
        return this.songs[nr];
    }
}
/**
 * Play the given song
 * @param song (has to have at least following structure: {artist:"...",title:"..."})
 * @returns the (new) current song (if not found the previous one)
 */
PlayQueue.prototype.playSong = function(song){
    const nr = this.getSongNr(song.artist, song.title);
    if(nr < this.songs.length){
        this.currentPos = nr;
        this.notifyListeners(this.songs[this.currentPos]);
    }
    return this.current();
}
/**
 * Removes the song with the given internal index
 * (To get this index call getSongNr(...))
 * @param nr
 */
PlayQueue.prototype.removeSongNr = function(nr){
    if(nr == this.currentPos && this.songs.length > 1){
        Central.getPlayer().nextSong();
    }
    this.songs.splice(nr, 1);
    this.notifyListeners(this.current());
}


//----------------------------------------------- CLASS PlayerSettings ---------------------------------
/**
 * Player settings all plugins share
 * @constructor
 */
function PlayerSettings(){
    this.volume = 100;
    this.playing = false;
}


//----------------------------------------------- CLASS MusicPlayer -------------------------------------
/**
 * Music Player that controls the playlist and all plugged-in music players
 * @constructor
 */
function MusicPlayer() {
    this.currentPlayer = null;
    this.playQueue = null;
    this.currentSong = null;

    this.settings = new PlayerSettings();
    this.players = [];

    this.playQueue = new PlayQueue();

    this.currentSong = this.playQueue.current();
    this.currentPlayer = null;

}
/**
 * @returns the currently playing plugin
 */
MusicPlayer.prototype.getCurrentPlayer = function () {
    return this.currentPlayer;
}
/**
 * @returns the current song
 */
MusicPlayer.prototype.getCurrentSong = function () {
    return this.currentSong;
}
/**
 * Adds a plugin (has to have alt least all functions of the class BaseMusicPlayer
 * (use the extend() function for easy extension)
 * @param player
 */
MusicPlayer.prototype.addPlugin = function (player) {
    player.settings = this.settings;
    this.players.push(player);
    this.currentSong = this.playQueue.current();
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
/**
 * Play the given song
 * If it does not have the source and plugin information, these are provided by the playQueue
 * @param song (at least {artist, title})
 */
MusicPlayer.prototype.playSong = function (song) {
    if(song.source == null || song.plugin == null){
        song = this.playQueue.playSong(song);
    }

    this.currentSong = song;
    if(this.currentPlayer != null){
        this.currentPlayer.stop();
    }
    var foundPlayer = false;
    if(this.currentSong != null) {
        for (var i = 0; i < this.players.length; i++) {
            if (this.currentSong.plugin === this.players[i].getName()) {
                this.currentPlayer = this.players[i];
                foundPlayer = true;
            }
        }
    }
    if(foundPlayer) {
        this.currentPlayer.load(this.currentSong.source);
        this.currentPlayer.play();
    }else{
        log("Cannot find a plugin for "+song, "warning");
    }
}
/**
 * Play the next song
 * @param if true, play a random song from the queue (optional, default is true)
 */
MusicPlayer.prototype.nextSong = function (random) {
    if(random !== true){
        random = false;
    }
    this.currentSong = this.playQueue.next(random);
    this.playSong(this.currentSong);
}
/**
 * Play the previous song
 */
MusicPlayer.prototype.lastSong = function () {
    this.currentSong = this.playQueue.prev();
    this.playSong(this.currentSong);
}
/**
 * @returns the playQueue
 */
MusicPlayer.prototype.getPlayQueue = function(){
    return this.playQueue;
}


// ---------------------------------------------- CLASS SearchEngine ------------------------------------
/**
 * Forwards all searches to all registered plugins (when search is called)
 * @constructor
 */
function SearchEngine(){
    this.plugins = [];
}
/**
 * Register a plugin
 * A plugin at least hast to have all functions of BaseSearchEngine - use the extend method
 * @param plugin
 */
SearchEngine.prototype.addPlugin = function(plugin){
    this.plugins.push(plugin);
}
/**
 * Searches songs by calling all plugins
 * @param (string) query
 * @returns Array of found songs
 */
SearchEngine.prototype.search = function(query){
    var results = [];

    for(var i = 0; i < this.plugins.length; i++){
        var res = this.plugins[i].search(query);
        for(var i2 = 0; i2 < res.length; i2++){
            results.push(res[i2]);
        }
    }

    // TODO: this may fail, also do tests - atm there are possible doubles
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
/**
 * This class forwards "add title" input to all registered plugins
 * (when verify is called)
 * @constructor
 */
function Verifier(){
    this.plugins = [];
}
/**
 * Register a plugin - (Base class is TODO)
 * @param plugin
 */
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
/**
 * Singleton class that handles all internal (model in MVC) classes
 * @returns {Central}
 * @constructor
 */
function Central() {
    this.verifier = new Verifier();
    this.player = new MusicPlayer();
    this.search = new SearchEngine();
    return this;
}

Central.instance = null;
/**
 * Get the instance
 * @returns {Central}
 */
Central.getInstance = function () {
    if (Central.instance === null) {
        Central.instance = new Central();
    }
    return Central.instance;
}
/**
 * @returns {MusicPlayer}
 */
Central.getPlayer = function () {
    return Central.getInstance().player;
}
/**
 * @returns {SearchEngine}
 */
Central.getSearch = function(){
    return Central.getInstance().search;
}
/**
 * @returns {Verifier}
 */
Central.getVerifier = function(){
    return Central.getInstance().verifier;
}

