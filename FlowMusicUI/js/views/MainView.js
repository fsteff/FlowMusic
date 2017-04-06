function MainView(){
    this.element = $("#mainview");
    this.tabs = [];

    $("#mainview-search-form").submit(function(data) {
        var input = $("#mainview-search-form > input[type=text][name=query]");
        var query = input.val();
        input.val("");
        var res = Central.getSearch().search(query);
        //if (res.length > 0){
            var tab = PageView.getInstance().mainview.newTab(SearchView, "Search: " + query);
            tab.setData(query, res);
        //}

        return false;
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

MainView.prototype.newTab = function(type, name, closetab){
    if(closetab == null){
        closetab = true;
    }
    const elem = $('<div class="maintab"></div>');
    elem.appendTo(this.element);

    const tab = extend(MainTab, type, elem, elem);
    this.tabs.push(tab);

    PageView.getInstance().sidepanel.addTab(elem, name, closetab);
    return tab;
}

MainView.prototype.hideAllTabs = function(){
    for(var i = 0; i < this.tabs.length; i++){
        this.tabs[i].hide();
    }
}

MainView.prototype.closeTab = function(element){
    var tab = null;
    var index = -1;
    for(var i = 0; i < this.tabs.length && index < 0; i++){
        var t = this.tabs[i];
        if(t.element == element){
            index = i;
        }
    }
    if(index > 0) {
        this.tabs.splice(index, 1);
    }
    element.remove();
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
MainTab.prototype.show = function(){
    this.element.show();
}

// ------------------------------------------------------------- CLASS Playlist ----------------------------------------

function PlaylistView(element){
    this.element = element;
    var playlist = Central.getPlayer().getPlaylist();

    this.onElementRightClick = function(elem){
        var ctx = new ContextMenu(null);
        ctx.addProperty(
            "<p>play</p>",
            function() {
                Central.getPlayer().playSong({
                    artist: elem[0],
                    title: elem[1]
                });
            });

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

function SearchView(element){
    this.element = element;
    this.element.html("no data yet, sorry");
    this.data = null;
}

SearchView.prototype.setData = function(query, data){
    this.data = data;

    this.onElementRightClick = function(elem){
        var ctx = new ContextMenu(null);
        ctx.addProperty(
            "<p>add to playlist</p>",
            function() {
                console.log(elem);
                Central.getPlayer().getPlaylist().add({
                    artist: elem[0],
                    title: elem[1],
                    plugin: elem[2][0].plugin,
                    source: elem[2][0].source
                });
            });

        return false;
    }
    //const header = $('<p>Results for "'+this.name+'"</p>')
    this.element.html('<p class="w3-container">Results for "'+query+'":</p>');
    const elem = $("<div></div>");
    elem.appendTo(this.element);

    var table = new Table(
        elem,
        ["Artist", "Title"],
        {
            visibility: [true, true, false],
            className: "playListTable",
            onElementRightClick: this.onElementRightClick
        }
    );

    var tableData = [];
    for(var i = 0; i < this.data.length; i++){
        tableData[i] = [];
        tableData[i][0] = this.data[i].artist;
        tableData[i][1] = this.data[i].title;
        tableData[i][2] = this.data[i].sources;
    }
    table.setData(tableData);
    table.draw();
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

    var rowelem;
    for(var row = 0; row < this.data.length; row++){
        rowelem = $("<tr></tr>");
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
    this.id = Math.random().toString(36).substring(7);
    this.element = $('<div class="contextMenu w3-card-4" id="'+this.id+'"></div>');
    this.element.css("left", mouseX+"px");
    this.element.css("top", mouseY+"px");

    $("body").append(this.element);

    const ctx = this;
    $(document).click(function(event) {
        var target = $(event.target);
        if( target.attr("id") !== ctx.element.attr("id") /*&& ctx.element.find("#"+ctx.id).length == 0*/){
            ctx.element.remove();
            $(document).unbind("click", this);
        }
    });
}

ContextMenu.prototype.addProperty = function(html, handler){
    var elem = $(html);
    elem.appendTo(this.element);

    const ctx = this;
    elem.click(handler);
}







