/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 *
 * Note to this file: this is ECMAScript 6
 * Only modern browsers support this!
 */

// TODO: to enable other formats implement an decoder in the backend or https://github.com/audiocogs/aurora.js

/**
 * Music player for playing local files
 * @extends BaseMusicPlayer
 */
class LocalFilePlayer extends BaseMusicPlayer{
    /**
     * @constructor
     */
    constructor() {
        super("local")
        var elem = "localaudio-frame";
        // depends on the browser, but eg chrome makes partial requests
        // and the backend answers in 1MB chunks
        $("body").append("<audio id=" + elem + " controls></audio>");
        this.audio = document.getElementById(elem);

        // go to next song if the currend one ended
        $(this.audio).on("ended", function () {
            Central.getPlayer().nextSong();
        });
    }

    /**
     * Play the song
     * @override
     */
    play() {
        this.settings.playing = true;
        this.audio.play();
    }

    /**
     * Pause the song
     * @override
     */
    pause() {
        this.settings.playing = false;
        this.audio.pause();
    }
    /**
     * Load a song
     * @param source {number} db source id
     * @override
     */
    load(source) {
        this.audio.src = "/song?id="+source;

    }
    /**
     * Set the volume (currently unused)
     * @param volume {number} 0-100
     * @override
     */
    setVolume(volume) {
        this.settings.volume = volume;
        this.audio.volume = volume * 0.01;
    }
    /**
     * @return {number} volume (0-100)
     * @override
     */
    getVolume() {
        this.settings.volume = this.audio.volume * 100;
        return this.settings.volume;
    }
    /**
     * Returns the current time position of the played song
     * @return {number} in seconds
     * @override
     */
    getTime() {
        return this.audio.currentTime;
    }
    /**
     * Returns the duration of the current song
     * @return {number} in seconds
     * @override
     */
    getDuration() {
        return this.audio.duration;
    }
    /**
     * Pauses the player
     * @override
     */
    stop() {
        this.pause();
    }
    /**
     * Tries to load a source by making a HEAD request
     * @param source {number} source id
     * @param callback {function(boolean)} callback handler
     * @override
     */
    tryLoadSource(source, callback) {
        $.ajax({
            type: "HEAD",
            async: true,
            url: "/song?id="+source,
            success: function(){callback(true)},
            error: function(){callback(false)}
        });
    }
}

// Add to main Music Player
Central.getPlayer().addPlugin(new LocalFilePlayer());

//------------------------------------------------------------- CLASS LocalSearchEngine --------------------------------

/**
 * BaseSearchEngine for querying the local database
 * @extends BaseSearchEngine
 */
class LocalSearchEngine extends BaseSearchEngine{
    /**
     * @constructor
     * @param name {string} name of the plugin
     */
    constructor(name){
        super(name);
    }

    /**
     * Query the local database
     * The database searches any entry for this query
     * (currently does not support album and tags (for now))
     * @param query {string}
     * @param callback (function(SongArray)}
     * @override
     */
    search(query, callback) {
        LocalComm.newMessage({
            command: "get",
            what: "song",
            filter: {title: query, artist: query, tag: query, album: query}
        }, "DATABASE", function (data) {
            if (typeof data.answer == 'undefined' || data.answer === null || data.answer.length === null) {
                Log.error("Local Song search: return answer invalid: " + data);
                return;
            }
            const answer = data.answer;
            const result = new SongArray(answer);

            callback(result);
        });
    }
}

// add to central search engine
Central.getSearch().addPlugin(new LocalSearchEngine("local"));



//------------------------------------------------------------- CLASS BrowseMusic --------------------------------------
/**
 * View class for "My Music"
 * @extends MainTab (done by using extend() for easier use)
 */
class BrowseMusic {
    /**
     * Creates a SideBar Tab and draws a SongTable in a MainView page
     * Automatically loads the data from the database and updates if the db was changed
     * @param element {HTMLElement} jQuery element or id
     */
    constructor(element) {
        const self = this;
        this.element = $(element);
        this.songs = new SongArray([]);
        this.engine = new LocalSearchEngine("local");


        // horizontal menu bar with the tabs "Songs", "Artists" and "Albums"
        this.categoryBar = $("<div class='topmenu'></div>");
        this.categoryBar.appendTo(this.element);

        this.categorySongs = $("<div class='topmenu tab active'>Songs</div>");
        this.categoryArtists = $("<div class='topmenu tab'>Artists</div>");
        this.categoryAlbums = $("<div class='topmenu tab'>Albums</div>");

        this.categorySongs.appendTo(this.categoryBar);
        this.categoryArtists.appendTo(this.categoryBar);
        this.categoryAlbums.appendTo(this.categoryBar);

        this.categorySongs.click(function () {
            self.viewSongs()
        });
        this.categoryAlbums.click(function () {
            self.viewAlbums()
        });
        this.categoryArtists.click(function () {
            self.viewArtists()
        });

        this.songsView = $("<div>loading ...</div>");
        this.artistsView = $("<div>loading ...</div>");
        this.albumsView = $("<div>loading ...</div>");

        this.songsView.table = null;
        this.albumsView.table = null;
        this.artistsView.table = null;

        this.currentView = null;

        window.setTimeout(function(){
            // init artist view (default)
            self.viewArtists();
            // load the data
            self.initSongs();
        }, 200);


        // register listener for "library changed" events
        LocalComm.registerListener("library changed", new Callable(function () {
            self.initSongs();
        }));
    }

    /**
     * views the songs table (songs sorted by title)
     */
    viewSongs() {
        this.clearView();
        this.categorySongs.attr("class", "topmenu tab active");
        this.currentView = this.songsView;
        this.songsView.appendTo(this.element);
    }

    /**
     * views the albums table (sorted by album name(s))
     */
    viewAlbums() {
        this.clearView();
        this.categoryAlbums.attr("class", "topmenu tab active");
        this.currentView = this.albumsView;
        this.albumsView.appendTo(this.element);
    }

    /**
     * views the artists table (sorted by artist name)
     */
    viewArtists() {
        this.clearView();
        this.categoryArtists.attr("class", "topmenu tab active");
        this.currentView = this.artistsView;
        this.artistsView.appendTo(this.element);
    }

    /**
     * removes the actually shown table
     */
    clearView() {
        if (this.currentView != null) {
            this.currentView.remove();
            this.currentView = null;
        }
        this.categorySongs.attr("class", "topmenu tab");
        this.categoryAlbums.attr("class", "topmenu tab");
        this.categoryArtists.attr("class", "topmenu tab");
    }

    /**
     * Loads the song list from the database and updates all tables
     */
    initSongs() {
        const self = this;

        self.engine.search("*", function (data) {
            self.songs = data;

            self.songs = self.songs.sortBy("title");

            let table = self.songsView.table;
            table.update(self.songs);

            self.initAlbums();
            self.initArtists();
        });

        let table = self.songsView.table;
        // create the table if it does not already exist
        if (table === null) {
            table = new SongTable(
                self.songsView,
                null,
                [{
                    name: "Title",
                    visible: true,
                }, {
                    name: "Artist",
                    visible: true
                }, {
                    name: "Album",
                    visible: true
                }, {
                    name: "Tags",
                    visible: false
                }]
            );
            self.songsView.table = table;
        }

    }

    /**
     * sorts the song list by the artist name and displays the resulting array with a SongTable
     */
    initArtists() {
        const self = this;
        const sortedByArtist = this.songs.sortBy("artist");
        let table = self.artistsView.table;
        if (table === null) {
            table = new SongTable(
                self.artistsView,
                null,
                [{
                    name: "Artist",
                    visible: true
                }, {
                    name: "Title",
                    visible: true,
                }, {
                    name: "Album",
                    visible: true
                }, {
                    name: "Tags",
                    visible: false
                }
                ]
            );
            self.artistsView.table = table;
        }
        table.update(sortedByArtist);

    }

    /**
     * sorts the song list by the album name and displays the resulting array with a SongTable
     */
    initAlbums() {
        const self = this;
        const sortedByAlbum = this.songs.sortBy("album");
        let table = self.albumsView.table;
        if (table === null) {
            table = new SongTable(
                self.albumsView,
                null,
                [{
                    name: "Album",
                    visible: true
                }, {
                    name: "Artist",
                    visible: true
                }, {
                    name: "Title",
                    visible: true,
                }, {
                    name: "Tags",
                    visible: false
                }]
            );
            self.albumsView.table = table;
        }
        table.update(sortedByAlbum);
    }
}

// automatically create the tab when document is ready
$(document).ready(function(){
    // cannot be closed (parameter close = false)
    PageView.getInstance().mainview.newTab(BrowseMusic, "My Music", false);
});
