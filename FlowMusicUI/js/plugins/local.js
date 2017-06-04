/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

// TODO: implement https://github.com/audiocogs/aurora.js or offline decoder to wav to enable other formats

function LocalFilePlayer() {
    var elem = "localaudio-frame";
    $("body").append("<audio id=" + elem + " controls></audio>");
    this.audio = document.getElementById(elem);

    // go to next song if the currend one ended
    $(this.audio).on("ended", function () {
        Central.getPlayer().nextSong();
    });
}

LocalFilePlayer.prototype.play = function () {
    this.settings.playing = true;
    this.audio.play();
}
LocalFilePlayer.prototype.pause = function () {
    this.settings.playing = false;
    this.audio.pause();
}
LocalFilePlayer.prototype.load = function (source) {
    this.audio.src = "/song?id="+source;

}

LocalFilePlayer.prototype.setVolume = function (volume) {
    this.settings.volume = volume;
    this.audio.volume = volume * 0.01;
}
LocalFilePlayer.prototype.getVolume = function () {
    this.settings.volume = this.audio.volume * 100;
    return this.settings.volume;
}
LocalFilePlayer.prototype.getTime = function () {
    return this.audio.currentTime;
}
LocalFilePlayer.prototype.getDuration = function () {
    return this.audio.duration;
}
LocalFilePlayer.prototype.stop = function(){
    this.pause();
}
LocalFilePlayer.prototype.tryLoadSource = function(source, callback){
    $.ajax({
        type: "HEAD",
        async: true,
        url: "/song?id="+source,
        success: function(){callback(true)},
        error: function(){callback(false)}
    });
}


LocalSearchEngine = function(){

}

LocalSearchEngine.prototype.search = function(query, callback){
    LocalComm.newMessage({
        command : "get",
        what: "song",
        filter : {title : query, artist : query, tag: query, album: query}
    },"DATABASE", function(data){
        if(typeof data.answer == 'undefined' || data.answer === null || data.answer.length === null){
            Log.error("Local Song search: return answer invalid: " + data);
            return;
        }
        const answer = data.answer;
        const result = new SongArray(answer);

        callback(result);
    });
}




Central.getSearch().addPlugin(extend(BaseSearchEngine, LocalSearchEngine, "local"));

// Add to main Music Player
Central.getPlayer().addPlugin(extend(BaseMusicPlayer, LocalFilePlayer, "local"));

//------------------------------------------------------------- CLASS BrowseMusic --------------------------------------

function BrowseMusic(element){
    const self = this;
    this.element = $(element);
    this.songs = new SongArray([]);

    this.categoryBar = $("<div class='topmenu'></div>");
    this.categoryBar.appendTo(this.element);

    this.categorySongs = $("<div class='topmenu tab active'>Songs</div>");
    this.categoryArtists = $("<div class='topmenu tab'>Artists</div>");
    this.categoryAlbums = $("<div class='topmenu tab'>Albums</div>");

    this.categorySongs.appendTo(this.categoryBar);
    this.categoryArtists.appendTo(this.categoryBar);
    this.categoryAlbums.appendTo(this.categoryBar);

    this.categorySongs.click(function(){self.viewSongs()});
    this.categoryAlbums.click(function(){self.viewAlbums()});
    this.categoryArtists.click(function(){self.viewArtists()});

    this.songsView = $("<div>loading songs...</div>");
    this.artistsView = $("<div>loading artists...</div>");
    this.albumsView = $("<div>loading albums...</div>");

    this.songsView.table = null;
    this.albumsView.table = null;
    this.artistsView.table = null;

    this.currentView = null;

    window.setTimeout(function(){
        self.initArtists();
        self.viewArtists();
        self.initSongs();
        self.viewArtists();
    }, 100);


    LocalComm.registerListener("library changed", function(){
        self.initSongs();
    });
}


BrowseMusic.prototype.viewSongs = function(){
    this.clearView();
    this.categorySongs.attr("class", "topmenu tab active");
    this.currentView = this.songsView;
    this.songsView.appendTo(this.element);
}

BrowseMusic.prototype.viewAlbums = function () {
    this.clearView();
    this.categoryAlbums.attr("class", "topmenu tab active");
    this.currentView = this.albumsView;
    this.albumsView.appendTo(this.element);
}

BrowseMusic.prototype.viewArtists = function () {
    this.clearView();
    this.categoryArtists.attr("class", "topmenu tab active");
    this.currentView = this.artistsView;
    this.artistsView.appendTo(this.element);
}

BrowseMusic.prototype.clearView = function () {
    if(this.currentView != null){
        this.currentView.remove();
        this.currentView = null;
    }
    this.categorySongs.attr("class", "topmenu tab");
    this.categoryAlbums.attr("class", "topmenu tab");
    this.categoryArtists.attr("class", "topmenu tab");
}

BrowseMusic.prototype.initSongs = function () {
    const self = this;
    const engine = new LocalSearchEngine();

    engine.search("*", function(data){
        self.songs = data;

        self.songs = self.songs.sortBy("title");

        let table = self.songsView.table;
        table.update(self.songs);

        self.initAlbums();
        self.initArtists();
    });

    let table = self.songsView.table;
    if(table === null) {
        table = new SongTable(
            self.songsView,
            null,
            [{
                name: "Title",
                visible: true,
            },{
                name: "Artist",
                visible: true
            },{
                name: "Album",
                visible: true
            }, {
                name: "Tags",
                visible: false
            }]
        );
        self.songsView.table = table;
        table.update(self.songs);
    }

}

BrowseMusic.prototype.initArtists = function () {
    const self = this;
    const sortedByArtist = this.songs.sortBy("artist");
    let table = self.artistsView.table;
    if(table === null) {
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

BrowseMusic.prototype.initAlbums = function () {
    const self = this;
    const sortedByAlbum = this.songs.sortBy("album");
    let table = self.albumsView.table;
    if(table === null) {
        table = new SongTable(
            self.albumsView,
            null,
            [{
                name: "Album",
                visible: true
            },{
                name: "Artist",
                visible: true
            },{
                name: "Title",
                visible: true,
            },{
                name: "Tags",
                visible: false
            }]
        );
        self.albumsView.table = table;
    }
    table.update(sortedByAlbum);
}


$(document).ready(function(){
    PageView.getInstance().mainview.newTab(BrowseMusic, "My Music", false);
});
