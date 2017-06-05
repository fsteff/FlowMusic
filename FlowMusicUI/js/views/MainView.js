/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

function MainView(){
    const self = this;
    this.element = $("#mainview");
    this.tabs = [];

    function search(data){
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

MainView.prototype.newTab = function(type, name, close){
    if(close == null){
        close = true;
    }
    const elem = $('<div class="maintab"></div>');
    elem.appendTo(this.element);

    const tab = extend(MainTab, type, elem, elem);
    this.tabs.push(tab);

    if(type == PlaylistView){
        tab.tabIndex = PageView.getInstance().sidepanel.addPlaylist(tab, name);
    }else {
        tab.tabIndex = PageView.getInstance().sidepanel.addTab(tab, name, close);
    }
    return tab;
}

MainView.prototype.hideAllTabs = function(){
    for(var i = 0; i < this.tabs.length; i++){
        this.tabs[i].hide();
    }
}

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
function MainTab(element){
    this.element = $(element);
    //this.resize();
}
MainTab.prototype.resize = function(){
    $(this.element).height($("#mainview").height() - $("#mainview-header").height());
    $(this.element).width($("#mainview").width());
}

MainTab.prototype.hide = function(){
    this.element.hide();
}
MainTab.prototype.show = function(update){
    if(update == null){
        update = true;
    }
    this.element.show();
    if(update) {
        this.update();
    }
}

MainTab.prototype.cleanUp = function(){
    
}

MainTab.prototype.update = function(){}


// ------------------------------------------------------------- CLASS PlayQueue ----------------------------------------

function PlayQueueView(element){
    this.element = element;
    var playlist = Central.getPlayer().getPlayQueue();

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

        return false;
    }

    var table = new Table(
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
function SearchView(element){
    this.element = element;
    this.element.html("Seaching...");
    this.data = null;
}

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

function EditSettings(element){
    const self = this;
    this.element = $(element);
    $("<h2>Settings</h2>").appendTo(this.element);
    this.dirBox = $("<div class='settingsBox'></div>")
    this.dirBox.appendTo(this.element);

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
            choose.click(function(){
                LocalComm.newMessage({command: "browse directory", number: num},
                    Message.Components.GUI);
            });

            remove.click(function(){
                dirs.splice(num, 1);
                cfg.MusicDirectories = dirs;
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

    LocalComm.registerListener("config changed", this.renderCallable);
}

EditSettings.prototype.cleanUp = function () {
    LocalComm.unregisterListener(this.renderCallable);
}

//------------------------------------------------------------- CLASS PlaylistView -------------------------------------

function PlaylistView(element){
    this.element = $(element);
    this.element.html("Loading...");
    this.playlistId = null;
    this.playlistName = null;
    this.songs = null;
    this.songTable = null;
    this.tableElement = $("<div></div>");
}

PlaylistView.prototype.setPlaylist = function(id, name){
    const self = this;
    this.playlistId = id;
    this.playlistName = name;
    this.songs = null;
    this.songTable = new SongTable(this.tableElement, /*this.playlistName*/ null);

    this.element.html("");

    $("<h3>"+this.playlistName+"</h3>").appendTo(this.element);
    const playButton = $("<div class='playlistPlayAll'><img src='/img/play.png'/> Play all</div>");
    playButton.appendTo(this.element);
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

PlaylistView.prototype.update = function(){
    const self = this;
    if(this.playlistId == null){
        return;
        //Log.error("PlaylistView: no playlistId set");
    }

    const onAnswer = function(msg){
        self.songs = new SongArray(msg.answer);
        self.songTable.update(self.songs);
    }


    LocalComm.newMessage({
        command: "get",
        what: "ViewPlaylistSongs",
        filter: {playlistid: this.playlistId}
    },
    Message.Components.DATABASE,
    onAnswer);
}

//------------------------------------------------------------- CLASS PlaylistOverView ---------------------------------

function PlaylistOverview(element){
    this.element = $(element);
    this.element.html("Loading...");
    this.playlists = [];
    this.playlistTabs = [];

    //this.update();

}

PlaylistOverview.prototype.createPlaylist = function () {
    // this is called from elsewhere, therefore "this" is something different
    const self = PageView.getInstance().sidepanel.playlists.page;
    const input = $("<input type='text'/>");
    const submit = $("<input type='button' value='create'/>");

    const ctx = new ContextMenu();
    ctx.addLabel("New Playlist:");
    ctx.addElement(input, function(){});
    ctx.addElement(submit, function(){
        const name = input.val();
        LocalComm.newMessage({
            command: "insertPlaylist",
            name: name
        }, Message.Components.DATABASE, function(msg){
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

PlaylistOverview.prototype.update = function(){
    // this is called from elsewhere, therefore "this" is something different
    const self = PageView.getInstance().sidepanel.playlists.page;

    const onAnswer = function(msg){
        self.element.html("<h3>Playlists</h3>");

        const addPlaylist = $("<div class='addPlaylist'><div class='add'>+</div>Create a new Playlist</div>");
        addPlaylist.appendTo(self.element);

        // use timeout to exit click handler before creating context menu
        addPlaylist.click(function(){window.setTimeout(self.createPlaylist, 10)});

        const openTab = PageView.getInstance().sidepanel.openTabNum;
        const sidepanel = PageView.getInstance().sidepanel;
        for(var i = 0; i < self.playlistTabs.length; i++) {
            var num = sidepanel.getTabNumByPage(self.playlistTabs[i]);
            if(num >= 0 && typeof sidepanel.openTabs[num].close == 'function'){
                sidepanel.openTabs[num].close();
            }else{
                Log.error("could not find open tab");
            }
        }
        self.playlistTabs = [];

        var answer = msg.answer;
        if(typeof answer == 'undefined' || answer == null){
            answer = [];
        }

        answer = answer.sort(function(a,b){
            var cha = Date.parse(a.timestamp);
            var chb = Date.parse(b.timestamp);
           /*var cha = parseInt(a.lastchanged);
           var chb = parseInt(b.lastchanged);
           if(isNaN(cha)){
               cha = 0;
           }
           if(isNaN(chb)){
                chb = 0;
           }*/
           return chb - cha;
        });

        self.playlists = [];
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
            elem.click(function(){
                var found = false;
                for(var i2 = 0; i2 < self.playlistTabs.length && !found; i2++){
                    const plView = self.playlistTabs[i2];
                    if(plView.playlistId == id){
                        found = PageView.getInstance().sidepanel.openTabByPage(plView, true);
                    }
                }
                if(! found) {
                    const view = PageView.getInstance().mainview.newTab(PlaylistView, name, true);
                    view.setPlaylist(id, name);
                    self.playlistTabs[i] = view;
                }
            });
        }

        for(var i = 0; i < answer.length && i < 3; i++) {
            const name = answer[i].name;
            const id = answer[i].playlistid;
            const view = PageView.getInstance().mainview.newTab(PlaylistView, name, true);
            view.setPlaylist(id, name);
            self.playlistTabs.push(view);
        }

        PageView.getInstance().sidepanel.openTab(openTab, false);
    }

    LocalComm.newMessage({
            command: "get",
            what: "ViewPlaylistSongs",
            filter: {playlistid: "*"}
        }, Message.Components.DATABASE,
        onAnswer);

}

// ------------------------------------------------------------ CLASS Table --------------------------------------------

function Table(element, head, options){

    this.element = $(element);
    this.data = [];
    this.head = head;
    this.options = options;
}

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
        if(this.options.onElementRightClick != null){
            const data = this.data[row];
            const table = this;
            $(rowelem).contextmenu(function(){
                return table.options.onElementRightClick(data);
            });
        }

        this.element.find("tbody").append(rowelem);
    }


}

Table.prototype.setData = function(data){
    this.data = data;
}

//---------------------------------------------- CLASS ContextMenu -----------------------------------------------------
function ContextMenu(){
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

    this.closeHandler = function(event){
        var target = $(event.target);
        for(let i = 0; i < self.properties.length; i++){
            let prop = self.properties[i];
            if(target[0] == prop.element[0]){
                prop.handler();
                return;
            }
        }

        self.close();
    }

    this.close = function(){
        self.element.remove();
        $(document).unbind("click", this.closeHandler);
        ContextMenu.instance = null;
    }

    $(document).bind("click", this.closeHandler); //.click(this.closeHandler);
    ContextMenu.instance = this;
}

ContextMenu.prototype.addLabel = function(html){
    const label = $("<div class='label'>"+html+"</div>");
    label.appendTo(this.element);
    this.properties.push({
        element: label,
        handler: function(){}
    });
}

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

ContextMenu.prototype.addElement = function(element, handler){
    element.appendTo(this.element);

    this.properties.push({
        element: element,
        handler: handler
    });
}

ContextMenu.instance = null;

ContextMenu.prototype.close = function () {
    this.closeHandler({target: $(document)});
}
/**
 * Adds a preconfigured property, thought to be used within a song table
 * "addToPlayQueue" - adds an "add to playqueue" property
 * "playNow" - adds an "play now" property
 * @param {string} property template name
 * @param {Array} has to have following structure: [0]: artist, [1]: title, [2] sources {array}
 */
ContextMenu.prototype.addPredefinedProperty = function(name, elem){
    const self = this;
    switch(name){
        case "addToPlayQueue":
            this.addProperty(
                "<div>add to playQueue</div>",
                function() {
                    const playable = [];
                    const src = elem[2];
                    for(var i = 0; i < src.length; i++){
                        const ci = i;
                        playable[i] = null;
                        Central.getPlayer().tryLoadSource(src[i].plugin, src[i].source, function(valid){
                            playable[ci] = valid;
                            var waiting = false;
                            for(var i2 = 0; i2 < src.length && !waiting; i2++){
                                if(playable[i2] === null){
                                    waiting = true;
                                }
                            }

                            if(!waiting){
                                var chosen = -1;
                                for(var i2 = 0; i2 < src.length && chosen < 0; i2++){
                                    if(playable[i2] === true){
                                        chosen = i2;
                                    }
                                }
                                if(chosen >= 0) {
                                    Central.getPlayer().getPlayQueue().add({
                                        artist: elem[0],
                                        title: elem[1],
                                        plugin: elem[2][chosen].plugin,
                                        source: elem[2][chosen].source
                                    });
                                }else{
                                    Log.warning("Cannnot get a valid source for "+JSON.stringify(elem));
                                }
                            }
                        });
                    }

                });
            break;
        case "playNow":
            this.addProperty(
                "<div>play now</div>",
                function() {
                    const playable = [];
                    const src = elem[2];
                    for(var i = 0; i < src.length; i++){
                        const ci = i;
                        playable[i] = null;
                        Central.getPlayer().tryLoadSource(src[i].plugin, src[i].source, function(valid){
                            playable[ci] = valid;
                            var waiting = false;
                            for(var i2 = 0; i2 < src.length && !waiting; i2++){
                                if(playable[i2] === null){
                                    waiting = true;
                                }
                            }

                            if(!waiting){
                                var chosen = -1;
                                for(var i2 = 0; i2 < src.length && chosen < 0; i2++){
                                    if(playable[i2] === true){
                                        chosen = i2;
                                    }
                                }
                                if(chosen >= 0) {
                                    var song = {
                                        artist: elem[0],
                                        title: elem[1],
                                        plugin: elem[2][chosen].plugin,
                                        source: elem[2][chosen].source
                                    };
                                    Central.getPlayer().getPlayQueue().add(song);
                                    Central.getPlayer().playSong(song);
                                }else{
                                    Log.warning("Cannnot get a valid source for "+JSON.stringify(elem));
                                }
                            }
                        });
                    }

                });
            break;
    }
}


