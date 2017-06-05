/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

/**
 * Class for the main page view
 * @constructor
 */
function MainView(){
    const self = this;
    this.element = $("#mainview");
    this.tabs = [];

    /**
     * Called when search is submitted
     * @return {boolean} false to disable further input form processing
     */
    function search(){
        const input = $("#mainview-search-form > input[type=text][name=query]");
        const query = input.val();
        input.val("");
        if(query != null && query.length > 0) {

            const tab = self.newTab(SearchView, "Search: " + query);
            Central.getSearch().search(query, function(result){
                tab.setData(query, result);
            });
        }
        return false;
    }

    $("#mainview-search-form").submit(search);
    $("#mainview-search-form > .searchicon").click(search);

    $("#mainview-addsong").click(function(){
        self.newTab(AddSong, "Add Song");
    });

    $("#mainview-settings").click(function(){
        self.newTab(EditSettings, "Settings");
    });
}
/**
 * Resizes the page
 */
MainView.prototype.resize = function(){
    var margin = 0;
    if(PageView.getInstance().sidepanel.opened){
        margin = SIDEPANEL_WIDTH;
    }
    $(this.element).height($(window).height() - $("#playbar").height());
    $(this.element).width($(window).width() - margin);

    for(var i = 0; i < this.tabs.length; i++){
        this.tabs[i].resize();
    }
}

/**
 * Creates a MainView Page and a SidePanel Tab for it
 * @param type {Subclass of MainTab}
 * @param name {string} display name
 * @param close {boolean} true if the tab should have a close button
 * @return {Subclass of MainTab} instance of [type]
 */
MainView.prototype.newTab = function(type, name, close){
    if(close == null){
        close = true;
    }
    const elem = $('<div class="maintab"></div>');
    elem.appendTo(this.element);

    const tab = extend(MainTab, type, elem, elem);
    this.tabs.push(tab);

    // if the tab is a playlist, add it to the playlists section
    if(type == PlaylistView){
        tab.tabIndex = PageView.getInstance().sidepanel.addPlaylist(tab, name);
    }else {
        tab.tabIndex = PageView.getInstance().sidepanel.addTab(tab, name, close);
    }
    return tab;
}

/**
 * Hides all tabs
 */
MainView.prototype.hideAllTabs = function(){
    for(var i = 0; i < this.tabs.length; i++){
        this.tabs[i].hide();
    }
}

/**
 * Closes a tab
 * @param element {MainTab}
 */
MainView.prototype.closeTab = function(element){
    var index = -1;
    for(var i = 0; i < this.tabs.length && index < 0; i++){
        var t = this.tabs[i];
        if(t.element[0] == element.element[0]){
            index = i;
        }
    }
    if(index >= 0) {
        this.tabs[index].cleanUp();
        this.tabs.splice(index, 1);
    }
    $(element.element).remove();
}
// ------------------------------------------------------------ CLASS MainTab ------------------------------------------
/**
 * Base Class for MainTab tabs
 * @param element {HTMLElement} jQuery HTMLElement or id
 * @constructor
 */
function MainTab(element){
    this.element = $(element);
}

/**
 * Resizes the MainTab to fit the page
 */
MainTab.prototype.resize = function(){
    $(this.element).height($("#mainview").height() - $("#mainview-header").height());
    $(this.element).width($("#mainview").width());
}

/**
 * Hides the MainTab
 */
MainTab.prototype.hide = function(){
    this.element.hide();
}

/**
 * Shows the MainTab
 * @param update {boolean} if true, the data model is updated
 */
MainTab.prototype.show = function(update){
    if(update == null){
        update = true;
    }
    this.element.show();
    if(update) {
        this.update();
    }
}

/**
 * Default function for cleanUp
 */
MainTab.prototype.cleanUp = function(){}
/**
 * Default function for update
 */
MainTab.prototype.update = function(){}


// ------------------------------------------------------------- CLASS PlayQueue ----------------------------------------
/**
 * Class for the PlayQueue View
 * @param element {HTMLElement} jQuery HTMLELement or id
 * @extends MainTab (by using MainView.newTab)
 * @constructor
 */
function PlayQueueView(element){
    this.element = $(element);
    var playlist = Central.getPlayer().getPlayQueue();

    /**
     * Function called instead of creating the default context menu
     * @param elem
     * @return {boolean}
     */
    this.onElementRightClick = function(elem){
        const ctx = new ContextMenu(null);
        ctx.addProperty(
            "play now",
            function() {
                Central.getPlayer().playSong({
                    artist: elem[0],
                    title: elem[1]
                });
            }
        );
        ctx.addProperty(
            "remove",
            function(){
                var queue = Central.getPlayer().getPlayQueue();
                var song = queue.getSongNr(elem[0], elem[1]);
                Central.getPlayer().getPlayQueue().removeSongNr(song);
            }
        );
        // disable the default context menu
        return false;
    }

    let table = new Table(
        this.element,
        ["Artist", "Title"],
        {
            visibility: [true, true, false],
            className: "playListTable",
            onElementRightClick: this.onElementRightClick
        }
    );

    playlist.addListener(function(){
        var data = [];
        var songs = playlist.getSongs();
        for(var i = 0; i < songs.length; i++){
            var row = [];
            row[0] = songs[i].artist;
            row[1] = songs[i].title;
            row[2] = songs[i].source;
            data.push(row);
        }
        table.setData(data);
        table.draw();

    });
}


//------------------------------------------------------- CLASS SearchView ---------------------------------------------
/**
 * Class for the Search result view
 * @param element {HTMLElement} jQuery HTMLElement or id
 * @extends MainTab (by using MainView.newTab)
 * @constructor
 */
function SearchView(element){
    this.element = $(element);
    this.element.html("Seaching...");
    this.data = null;
}
/**
 * Updates the data (called when the search results are updated)
 * and creates a SongTable containing the search results
 * @param query {string}
 * @param data {SongArray}
 */
SearchView.prototype.setData = function(query, data){
    this.data = data;
    this.table = new SongTable(
        this.element,
        'Results for "' + query + '":',
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
    this.table.update(this.data);
}

//------------------------------------------------------------- CLASS AddSong ------------------------------------------
/**
 * MainTab class for adding a song (opened when clicking the large plus at the right top)
 * @param element {HTMLElement} jQuery HTMLElement or id
 * @extends MainTab (by using MainView.newTab)
 * @constructor
 */
function AddSong(element){
    const self = this;
    this.element = $(element);
    $("<h3>Add a new song</h3>").appendTo(this.element);

    const form = $('<form class="addSong"></form>')
    form.appendTo(this.element);

    const enterLink = "enter a link";
    const urlInput = $('<input type="text" name="url" value="'+enterLink+'"/>');
    urlInput.appendTo(form);
    const artistInput = $('<input type="text" name="artist" value="artist name"/>');
    artistInput.appendTo(form);
    const titleInput = $('<input type="text" name="title" value="song title"/>');
    titleInput.appendTo(form);

    const submitButton = $('<input type="submit" name="submit" value="save"/>');
    submitButton.appendTo(form);

    const preview = $('<div class="addSong preview"></div>');
    preview.appendTo(this.element);

    urlInput.click(function(){
        var url = urlInput.val();
        if(url == enterLink){
            urlInput.val("");
        }
    });

    const songdata = {
        title: null,
        artist: null,
        sources: null
    }

    urlInput.on("input", function(){
        var url = urlInput.val().trim();
        if(url == ""){
            return;
        }
        preview.html("");
        submitButton.val("save");
        artistInput.val("artist name");
        titleInput.val("song title");
        // try to load the url
        var valid = Central.getUrlPreview().preview(preview, url, function(data){
            songdata.sources = [{type: data.type, value: data.value}];
            if(typeof data.artist == "string"){
                songdata.artist = data.artist;
                artistInput.val(data.artist);
            }
            if(typeof data.title == "string"){
                songdata.title = data.title;
                titleInput.val(data.title);
            }
        });

        if(!valid){
            preview.html("invalid url");
        }
    });


    // on submit button click:
    form.submit(function(event){
        event.preventDefault();
        var msg = {
            command: "insertSong",
            artist: artistInput.val(),
            title: titleInput.val(),
            sources: songdata.sources
        }

        LocalComm.newMessage(msg, Message.Components.DATABASE, function(){
            submitButton.val("saved");
        });
    });
}

//------------------------------------------------------------- CLASS EditSettings -------------------------------------

/**
 * MainTab page for editing the settings
 * @param element {HTMLElement} jQuery HTMLElement or id
 * @extends MainTab (by using MainView.newTab)
 * @constructor
 */
function EditSettings(element){
    const self = this;
    this.element = $(element);
    $("<h2>Settings</h2>").appendTo(this.element);
    this.dirBox = $("<div class='settingsBox'></div>")
    this.dirBox.appendTo(this.element);

    /**
     * Called when the message from the central containing the settings arrives
     * @param msg {object}
     */
    this.render = function(msg){
        var d = [];
        if(typeof msg.config === 'object'
            && typeof msg.config.MusicDirectories === 'object'){
            d = msg.config.MusicDirectories;
        }
        self.dirBox.html("Music Directories<br>");
        const dirs = d;
        const cfg = msg.config;
        for(var i = 0; i < dirs.length; i++){
            const box = $("<div class='settingsBox entry'>"+dirs[i]+"</div>");
            const choose = $("<div class='settingsBox entry choose'>...</div>");
            const remove = $("<div class='settingsBox entry remove'>delete</div>");
            remove.appendTo(box);
            choose.appendTo(box);
            box.appendTo(self.dirBox);

            const num = i;
            // opens a JFileChooser from the backend
            choose.click(function(){
                LocalComm.newMessage({command: "browse directory", number: num},
                    Message.Components.GUI);
            });

            // removes a folder entirely
            remove.click(function(){
                dirs.splice(num, 1);
                cfg.MusicDirectories = dirs;
                // update the config (-> answer to this the listener)
                LocalComm.newMessage({command: "set config",
                    config: cfg}, Message.Components.CENTRAL);
            });
        }
        const box = $("<div class='settingsBox add'>+</div>");
        box.appendTo(self.dirBox);
        const num = -1;
        box.click(function(){
            LocalComm.newMessage({command: "browse directory", number: num},
                Message.Components.GUI);
        });
    }

    this.renderCallable = new Callable(this.render);

    LocalComm.newMessage(
        {command: "get config"},
        Message.Components.CENTRAL, this.render);

    // on every change of the settings, update the view:
    LocalComm.registerListener("config changed", this.renderCallable);
}
/**
 * Removes the listener when the page is destroyed
 */
EditSettings.prototype.cleanUp = function () {
    LocalComm.unregisterListener(this.renderCallable);
}

//------------------------------------------------------------- CLASS PlaylistView -------------------------------------

/**
 * MainTab subclass that displays a playlist
 * @param element {HTMLElement} jQuery element or id
 * @extends MainTab (by using MainView.newTab)
 * @constructor
 */
function PlaylistView(element){
    this.element = $(element);
    this.element.html("Loading...");
    this.playlistId = null;
    this.playlistName = null;
    this.songs = null;
    this.songTable = null;
    this.tableElement = $("<div></div>");
}
/**
 * Initializes the playlist
 * @param id {number} playlist id
 * @param name {string} playlist name
 */
PlaylistView.prototype.setPlaylist = function(id, name){
    const self = this;
    this.playlistId = id;
    this.playlistName = name;
    this.songs = null;
    this.songTable = new SongTable(this.tableElement, null, null);

    this.element.html("");

    $("<h3>"+this.playlistName+"</h3>").appendTo(this.element);
    const playButton = $("<div class='playlistPlayAll'><img src='/img/play.png'/> Play all</div>");
    playButton.appendTo(this.element);
    // on button click, the entire playlist is added to the PlayQueue and the first song is played
    // TODO: little bug see /js/models/Player.js
    playButton.click(function(){
        if(self.songs !== null){
            Central.getPlayer().getPlayQueue().removeAll();
            for(let i = 0; i < self.songs.length; i++){
                if(i == 0){
                    Central.getPlayer().addToQueue(self.songs[i], true);
                }else{
                    Central.getPlayer().addToQueue(self.songs[i], false);
                }
            }

        }
    });

    this.tableElement.appendTo(this.element);

    this.update();
}

/**
 * Update the page
 * @override
 */
PlaylistView.prototype.update = function(){
    const self = this;
    if(this.playlistId == null){
        return;
    }

    const onAnswer = function(msg){
        self.songs = new SongArray(msg.answer);
        self.songTable.update(self.songs);
    }

    // get the song entries from the db
    LocalComm.newMessage({
        command: "get",
        what: "ViewPlaylistSongs",
        filter: {playlistid: this.playlistId}
    },
    Message.Components.DATABASE,
    onAnswer);
}

//------------------------------------------------------------- CLASS PlaylistOverView ---------------------------------
/**
 * Provides an overview over all playlists - this is created on document.ready in /js/views/PageView.js
 * @param element {HTMLElement] jQuery element or id
 * @extends MainTab (by using MainView.newTab)
 * @constructor
 */
function PlaylistOverview(element){
    this.element = $(element);
    this.element.html("Loading...");
    this.playlists = [];
    this.playlistTabs = [];
}
/**
 * Called when the "create new playlist" button is clicked
 */
PlaylistOverview.prototype.createPlaylist = function () {
    // this is called from elsewhere, therefore "this" is something different
    const self = PageView.getInstance().sidepanel.playlists.page;
    const input = $("<input type='text'/>");
    const submit = $("<input type='button' value='create'/>");

    const ctx = new ContextMenu();
    ctx.addLabel("New Playlist:");
    ctx.addElement(input, function(){});
    // if the "create" button is clicked save the playlist
    ctx.addElement(submit, function(){
        const name = input.val();
        LocalComm.newMessage({
            command: "insertPlaylist",
            name: name
        }, Message.Components.DATABASE, function(msg){
            /**
             * The id of the newly created playlist
             * @type {Number}
             */
            const answer = parseInt(msg.answer);
            if(! isNaN(answer)){
                const view = PageView.getInstance().mainview.newTab(PlaylistView, name, true);
                view.setPlaylist(answer, name);
                self.playlistTabs.push(view);
                self.playlists.push({name: name, id: answer});
            }
        });

        ctx.close();
    })
}
/**
 * Updates the playlist overview
 * @override
 */
PlaylistOverview.prototype.update = function(){
    // this is called from elsewhere, therefore "this" is something different
    const self = PageView.getInstance().sidepanel.playlists.page;

    /**
     * Called when the answer from the database arrives
     * @param msg {object}
     */
    const onAnswer = function(msg){
        let answer = msg.answer;
        if(typeof answer == 'undefined' || answer == null){
            answer = [];
        }

        // sort the playlist entries by their modification time
        answer = answer.sort(function(a,b){
            let cha = Date.parse(a.timestamp);
            let chb = Date.parse(b.timestamp);
            return chb - cha;
        });

        self.element.html("<h3>Playlists</h3>");

        const addPlaylist = $("<div class='addPlaylist'><div class='add'>+</div>Create a new Playlist</div>");
        addPlaylist.appendTo(self.element);

        // use timeout to exit click handler before creating context menu
        addPlaylist.click(function(){window.setTimeout(self.createPlaylist, 10)});

        const openTab = PageView.getInstance().sidepanel.openTabNum;
        const sidepanel = PageView.getInstance().sidepanel;

        // close the currently open tab (it is opened again afterwards)
        for(let i = 0; i < self.playlistTabs.length; i++) {
            let num = sidepanel.getTabNumByPage(self.playlistTabs[i]);
            if(num >= 0 && typeof sidepanel.openTabs[num].close === 'function'){
                sidepanel.openTabs[num].close();
            }else{
                Log.error("could not find open tab");
            }
        }

        self.playlistTabs = [];
        self.playlists = [];

        // ------------- Update the MainTab Page: --------------------

        const list = $("<ul></ul>");
        list.appendTo(self.element);
        for(var i = 0; i < answer.length; i++){
            const name = answer[i].name;
            const id = answer[i].playlistid;
            self.playlists.push({
                name: name,
                id: id
            });

            const elem = $("<li class='playlistEntry'>"+answer[i].name + " (" + answer[i].entries + " Songs)</li>");
            elem.appendTo(list);

            // on click open the playlist - creates a new PlaylistView only if necessary
            elem.click(function(){
                var found = false;
                // first search the open tabs for the playlist
                for(var i2 = 0; i2 < self.playlistTabs.length && !found; i2++){
                    const plView = self.playlistTabs[i2];
                    if(plView.playlistId === id){
                        // views a tab if it exists - returns true if it was found, false if not
                        found = PageView.getInstance().sidepanel.openTabByPage(plView, true);
                    }
                }
                // if the playlist was not already opened, do it now
                if(! found) {
                    const view = PageView.getInstance().mainview.newTab(PlaylistView, name, true);
                    view.setPlaylist(id, name);
                    self.playlistTabs[i] = view;
                }
            });
        }

        // --------- load the 3 last used playlists and view them in the sidebar ------------
        for(var i = 0; i < answer.length && i < 3; i++) {
            const name = answer[i].name;
            const id = answer[i].playlistid;
            const view = PageView.getInstance().mainview.newTab(PlaylistView, name, true);
            view.setPlaylist(id, name);
            self.playlistTabs.push(view);
        }

        // re-open the previously closed MainTab
        PageView.getInstance().sidepanel.openTab(openTab, false);
    }

    // get a list of all playlists
    LocalComm.newMessage({
            command: "get",
            what: "ViewPlaylistSongs",
            filter: {playlistid: "*"}
        }, Message.Components.DATABASE,
        onAnswer);

}

// ------------------------------------------------------------ CLASS Table --------------------------------------------
/**
 * Class for dynamically creating a general purpose table.
 * (for tables of songs there exists the class SongTable, which works similar to this one)
 * @param element {HTMLElement} jQuery element or id
 * @param head {Array} table head (array of strings)
 * @param options {object} of the form:
 * {
 *      visiblility: [] true or false per column
 *      onElementRightClick: function creating the contextMenu
 * }
 * @constructor
 */
function Table(element, head, options){

    this.element = $(element);
    this.data = [];
    this.head = head;
    this.options = options;
}
/**
 * (Re-)Draws the table
 */
Table.prototype.draw = function(){
    var classname = this.options.className;
    var html = "<table class='w3-table "+classname+"'><tr>";
    for(var i = 0; i < this.head.length; i++){
        html+="<th>"+this.head[i]+"</th>";
    }
    html += "</tr></table>";
    this.element.html(html);

    for(var row = 0; row < this.data.length; row++){
        var rowelem = $("<tr class='tablerow'></tr>");
        html = "";
        for(var col = 0; col < this.data[row].length; col++){
            if(this.options.visibility[col] === true){

               html+= "<td>"+this.data[row][col]+"</td>";
            }
        }
        rowelem.html(html);
        if(this.options.onElementRightClick !== null){
            const data = this.data[row];
            const table = this;
            $(rowelem).contextmenu(function(){
                return table.options.onElementRightClick(data);
            });
        }

        this.element.find("tbody").append(rowelem);
    }


}
/**
 * Update the data
 * @param data {Array} 2d-Array containing the rows and columns [][]
 */
Table.prototype.setData = function(data){
    this.data = data;
}

//---------------------------------------------- CLASS ContextMenu -----------------------------------------------------


// global variables containing the mouse moves - needed by ContextMenu
var mouseX = 0;
var mouseY = 0;

// listen to mouse moves
jQuery(document).ready(function () {
    $(document).mousemove(function (e) {
        var bodyOffsets = document.body.getBoundingClientRect();
        mouseX = e.pageX - bodyOffsets.left;
        mouseY = e.pageY;
    });
})

/**
 * Class for creating a right-click context menu.
 * Usage:  $(element).contextmenu( ... new ContextMenu() ...)
 * @constructor
 */
function ContextMenu(){
    // if already an other context menu is open, destroy it first
    if(ContextMenu.instance != null){
        ContextMenu.instance.close();
    }

    this.id = "context-menu";//Math.random().toString(36).substring(7);
    this.element = $('<div class="contextMenu w3-card-4" id="'+this.id+'"></div>');
    this.element.css("left", mouseX+"px");
    this.element.css("top", mouseY+"px");

    $("body").append(this.element);

    this.properties = [];

    const self = this;

    /**
     * Called on every click onto the document
     * @param event
     */
    this.closeHandler = function(event){
        var target = $(event.target);
        // if the target is inside the context menu, call the handler of the clicked element
        for(let i = 0; i < self.properties.length; i++){
            let prop = self.properties[i];
            if(target[0] == prop.element[0]){
                prop.handler();
                return;
            }
        }
        // if the target was outside the context menu, close it
        self.close();
    }

    $(document).bind("click", this.closeHandler);
    ContextMenu.instance = this;
}

ContextMenu.instance = null;

/**
 * Adds a label to the context menu.
 * A label is displayed a bit darker and has no click handler.
 * @param html {string} displayed content
 */
ContextMenu.prototype.addLabel = function(html){
    const label = $("<div class='label'>"+html+"</div>");
    label.appendTo(this.element);
    this.properties.push({
        element: label,
        handler: function(){}
    });
}
/**
 * Adds a property to the context menu (standard use)
 * After the click handler is called, the context menu is closed.
 * @param html {string} displayed content
 * @param handler {function} called on click
 */
ContextMenu.prototype.addProperty = function(html, handler){
    const self = this;
    var elem = $("<div class='property'>"+html+"</div>");
    elem.appendTo(this.element);

    this.properties.push({
        element: elem,
        handler: function(){
            handler();
            self.close();
        }
    });
}
/**
 * Adds a special element.
 * A click onto this does not close the context menu.
 * @param element {HTMLElement} can be plain text or html code
 * @param handler {function} called on click
 */
ContextMenu.prototype.addElement = function(element, handler){
    element.appendTo(this.element);

    this.properties.push({
        element: element,
        handler: handler
    });
}


/**
 * Closes the context menu
 */
ContextMenu.prototype.close = function () {
    this.element.remove();
    $(document).unbind("click", this.closeHandler);
    ContextMenu.instance = null;
}



