/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

//----------------------------------------------- CLASS PlayQueue ---------------------------------------
/**
 * PlayQueue stores and manages the list of songs in the current playlistId/queue.
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
        var prev = this.history[this.history.length-1];
        this.currentPos = this.songs.indexOf(prev);
        if(this.currentPos < 0){
            this.songs.splice(0, 0, prev);
            this.currentPos = 0;
        }
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
    var i = this.listeners.indexOf(object);
    if(i >= 0){
        this.listeners.splice(i, 1);
    }else{
        log("cannnot remove listener - not presend", "error");
    }

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
 * @returns {Integer} index number
 */
PlayQueue.prototype.getSongNr = function(artist, title){
    var nr = 0;
    var found = false;
    for(; nr < this.songs.length && !found; nr++){
        if(this.songs[nr].artist == artist && this.songs[nr].title == title){
            return nr;
        }
    }
    return -1;
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
    if(this.songs.length > this.currentPos && this.songs[this.currentPos] != null) {
        this.history.push(this.songs[this.currentPos]);
        while (this.history.length > 10) {
            this.history.shift();
        }
    }

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

/**
 * Removes all song from the queue
 */
PlayQueue.prototype.removeAll = function(){
    this.songs = [];
    this.currentPos = 0;
    this.history = [];
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
 * Music Player that controls the playlistId and all plugged-in music players
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
    Log.info("MusicPlayer: registered plugin '"+player.getName()+"'");

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
    song = this.playQueue.playSong(song);

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
        this.playQueue.notifyListeners(song);
        Log.info("MusicPlayer: playing song "+ JSON.stringify(song));
    }else{
        Log.warning("Cannot find a plugin for "+JSON.stringify(song));
    }
}
/**
 * Play the next song
 * @param {boolean} if true, play a random song from the queue (optional, default is true)
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
 * @returns {PlayQueue} the playQueue
 */
MusicPlayer.prototype.getPlayQueue = function(){
    return this.playQueue;
}

/**
 * Tries to load a source and calls the callback afterwards with true or false
 * (the callback has to have exactly one parameter, which accepts boolean)
 * @param plugin {string} name of the plugin
 * @param source {string} source, id or whatever the plugin understands
 * @param callback {function(boolean)}
 */
MusicPlayer.prototype.tryLoadSource = function(plugin, source, callback){
    var found = false;
    for(var i = 0; i < this.players.length && !found; i++){
        if(this.players[i].getName() === plugin){
            this.players[i].tryLoadSource(source, callback);
            found = true;
        }
    }
    if(! found) {
        callback(false);
    }
}

/**
 * Adds a song to the queue and chooses a source
 * @param song {Song}
 * @param play {Boolean}
 */
MusicPlayer.prototype.addToQueue = function (song, play) {
    const playable = [];
    const state = {
        countDown: 0,
        finished: false
    }

    function choose() {
        let chosen = -1;
        let options = [];
        for (let i2 = 0; i2 < song.sources.length; i2++) {
            if (playable[i2] === true) {
                options.push({index: i2, type: song.sources.get(i2).type});
            }
        }
        if(options.length == 1){
            chosen = options[0].index;
        }else if(options.length > 1){
            options.sort(function(a,b){
               return Config.comparePluginRowing(a.type, b.type);
            });
            chosen = options[0].index;
        }

        if (chosen >= 0) {
            const s = {
                artist: song.artist,
                title: song.title,
                plugin: song.sources.get(chosen).type,
                source: song.sources.get(chosen).value
            };
            Central.getPlayer().getPlayQueue().add(s);
            if (play) {
                Central.getPlayer().playSong(s);
            }
        } else {
            Log.warning("Cannnot get a valid source for " + JSON.stringify(elem));
        }
    }

    for (let i = 0; i < song.sources.length; i++) {
        const src = song.sources[i];
        state.countDown++;
        Central.getPlayer().tryLoadSource(src.type, src.value, function (valid) {
            playable[i] = valid;
            state.countDown--;

            if (state.countDown === 0 && state.finished) {
                choose();
            }
        });

    }
    ;
    state.finished = true;

    // if all callbacks returned immediately
    if (state.countDown == 0) {
        choose();
    }

}
