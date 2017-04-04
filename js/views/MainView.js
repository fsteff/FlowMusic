function MainView(){
    this.element = $("#mainview");
    this.tabs = [];
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

MainView.prototype.newTab = function(type, name){
    const elem = $('<div class="maintab"></div>');
    elem.appendTo(this.element);

    const tab = extend(MainTab, type, elem, elem);
    this.tabs.push(tab);

    PageView.getInstance().sidepanel.addTab(elem, name);
    //tab.resize();
}

MainView.prototype.hideAllTabs = function(){
    for(var i = 0; i < this.tabs.length; i++){
        this.tabs[i].hide();
    }
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
    this.element.html("no searches yet, sorry");
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







