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
        url: source,
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
        if(data.answer === null || data.answer.length === null){
            Log.error("Local Song search: return answer invalid: " + data);
            return;
        }
        var answer = data.answer;
        var result = [];
        for(var i = 0; i < answer.length; i++){
            var song = {
                title: answer[i].title,
                artist: answer[i].artist,
                sources: []
            }
            var src = answer[i].sources;
            if(typeof src == 'undefined' || src == null){
                src = [];
            }
            for(var i2 = 0; i2 < src.length; i2++){
                var obj = {
                    plugin: src.type,
                    source: src.value
                };
                if(src.type == 'local'){
                    obj.source = src.sourceid;
                }

                song.sources.push(obj);
            }
            result[i] = song;
        }

        if(result.length > 0){
            callback(result);
        }
    });
}




Central.getSearch().addPlugin(extend(BaseSearchEngine, LocalSearchEngine, "local"));

// Add to main Music Player
Central.getPlayer().addPlugin(extend(BaseMusicPlayer, LocalFilePlayer, "local"));

//------------------------------------------------------------- CLASS BrowseMusic --------------------------------------

function BrowseMusic(element){
    const self = this;
    this.element = $(element);
    this.songs = [];

    this.categoryBar = $("<div class='topmenu'></div>");
    this.categoryBar.appendTo(element);

    this.categorySongs = $("<div class='topmenu tab active'>Songs</div>");
    this.categoryArtists = $("<div class='topmenu tab'>Artists</div>");
    this.categoryAlbums = $("<div class='topmenu tab'>Albums</div>");

    this.categorySongs.appendTo(this.categoryBar);
    this.categoryArtists.appendTo(this.categoryBar);
    this.categoryAlbums.appendTo(this.categoryBar);

    this.categorySongs.click(function(){self.viewSongs()});
    this.categoryAlbums.click(function(){self.viewAlbums()});
    this.categoryArtists.click(function(){self.viewArtists()});

    this.songsView = $("<div>songs</div>");
    this.artistsView = $("<div>artists</div>");
    this.albumsView = $("<div>albums</div>");

    this.songsView.table = null;
    this.albumsView.table = null;
    this.artistsView.table = null;

    this.currentView = null;
    this.viewSongs();

    this.initSongs();
}

BrowseMusic.prototype.viewSongs = function(){
    this.clearView();
    this.currentView = this.songsView;
    this.songsView.appendTo(this.element);
    this.categorySongs.attr("class", "topmenu tab active");
    this.initSongs();
}

BrowseMusic.prototype.viewAlbums = function () {
    this.clearView();
    this.currentView = this.albumsView;
    this.albumsView.appendTo(this.element);
    this.categoryAlbums.attr("class", "topmenu tab active");
    this.initSongs();
}

BrowseMusic.prototype.viewArtists = function () {
    this.clearView();
    this.currentView = this.artistsView;
    this.artistsView.appendTo(this.element);
    this.categoryArtists.attr("class", "topmenu tab active");
    this.initSongs();
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

    const onElementRightClick = function(element){
        var ctx = new ContextMenu(null);
        ctx.addPredefinedProperty("playNow", element);
        ctx.addPredefinedProperty("addToPlayQueue", element);
        return false;
    }

    engine.search("*", function(data){
        self.songs = data;
        for(var i = 0; i < data.length; i++){
            if(typeof data[i].album === 'undefined'){
                data[i].album = "";
            }
        }
        var table = self.songsView.table;
        var tableData = [];
        for(var i = 0; i < data.length; i++){
            tableData[i] = [];
            tableData[i][0] = data[i].artist;
            tableData[i][1] = data[i].title;
            tableData[i][2] = data[i].sources;
            tableData[i][3] = data[i].album;
        }

        table.setData(tableData);
        table.draw();

        self.initAlbums();
        self.initArtists();
    });

    var table = self.songsView.table;
    if(table == null) {
        table = new Table(
            self.songsView,
            ["Artist", "Title", "Album"],
            {
                visibility: [true, true, false, true],
                className: "playListTable",
                onElementRightClick: onElementRightClick
            }
        );
        self.songsView.table = table;
        table.setData(self.songs);
        table.draw();
    }

}

BrowseMusic.prototype.initArtists = function () {
    const self = this;
    const onElementRightClick = function(element){
        var ctx = new ContextMenu(null);
        ctx.addPredefinedProperty("playNow", element);
        ctx.addPredefinedProperty("addToPlayQueue", element);
        return false;
    }
    var sortedByArtist = this.songs.sort(function(a, b){
        var strA = "";
        var strB = "";
        if(typeof a.artist !== 'undefined' && a.artist !== null){
            strA = a.artist;
        }
        if(typeof b.artist !== 'undefined' && b.artist !== null){
            strB = b.artist;
        }
       return strA.localeCompare(strB);
    });

    var table = self.artistsView.table;
    if(table == null) {
        table = new Table(
            self.artistsView,
            ["Artist", "Title", "Album"],
            {
                visibility: [true, true, false, true],
                className: "playListTable",
                onElementRightClick: onElementRightClick
            }
        );
        self.artistsView.table = table;
    }
    var tableData = [];
    for(var i = 0; i < sortedByArtist.length; i++){
        tableData[i] = [];
        tableData[i][0] = sortedByArtist[i].artist;
        tableData[i][1] = sortedByArtist[i].title;
        tableData[i][2] = sortedByArtist[i].sources;
        tableData[i][3] = sortedByArtist[i].album;
    }

    table.setData(tableData);
    table.draw();


}

BrowseMusic.prototype.initAlbums = function () {
    const self = this;
    const onElementRightClick = function(element){
        var ctx = new ContextMenu(null);
        ctx.addPredefinedProperty("playNow", element);
        ctx.addPredefinedProperty("addToPlayQueue", element);
        return false;
    }
    var sortedByAlbum = this.songs.sort(function(a, b){
        var strA = "";
        var strB = "";
        if(typeof a.album !== 'undefined' && a.album !== null){
            strA = a.album;
        }
        if(typeof b.album !== 'undefined' && b.album !== null){
            strB = b.album;
        }
        return strA.localeCompare(strB);
    });
    var table = self.albumsView.table;
    if(table == null) {
        table = new Table(
            self.albumsView,
            ["Artist", "Title", "Album"],
            {
                visibility: [true, true, false, true],
                className: "playListTable",
                onElementRightClick: onElementRightClick
            }
        );
        self.albumsView.table = table;
    }
    var tableData = [];
    for(var i = 0; i < sortedByAlbum.length; i++){
        tableData[i] = [];
        tableData[i][0] = sortedByAlbum[i].artist;
        tableData[i][1] = sortedByAlbum[i].title;
        tableData[i][2] = sortedByAlbum[i].sources;
        tableData[i][3] = sortedByAlbum[i].album;
    }

    table.setData(tableData);
    table.draw();
}

BrowseMusic.prototype.update = function(){
    this.initSongs();
}

$(document).ready(function(){
    PageView.getInstance().mainview.newTab(BrowseMusic, "My Music", false);
});
