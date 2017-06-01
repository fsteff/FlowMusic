/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

const SIDEPANEL_WIDTH = 160;
const SIDEPANEL_WIDTH_PX = SIDEPANEL_WIDTH+"px";

function SidePanel(){
    const self = this;
    this.element = $("#sidepanel");
    this.opened = false;
    this.openTabNum = 0;

    this.openTabs = [];

    this.tabSpace = $("<div id='sidepanel-tabSpace'></div>");
    this.tabSpace.appendTo(this.element);
    this.tabSpace.height(this.element.height()/2);

    this.playlistSpace = $("<div></div>");
    this.playlistSpace.appendTo(this.element);

    const playlistsTab = $('<div class="sidepanelbutton active w3-bar-item w3-button" ' +
        'id="sidepanel-playlists">Playlists</div>');
    playlistsTab.appendTo(this.playlistSpace);

    this.playlists = {
        page: null,
        tab: playlistsTab
    }

    const index = this.openTabs.push(this.playlists) - 1; //  -> always 0

    playlistsTab.click(function(event){
        PageView.getInstance().mainview.hideAllTabs();
        self.openTabNum = index;
        self.playlists.page.show();
        self.playlists.page.resize();

        for(var i = 0; i < self.openTabs.length; i++){
            self.openTabs[i].tab.attr("class", "sidepanelbutton w3-bar-item w3-button");
        }
    });


}

SidePanel.prototype.resize = function(){
    this.tabSpace.height(this.element.height()/2);
}

SidePanel.prototype.open = function () {
    var mainview = $("#mainview");
    mainview.css("margin-left", SIDEPANEL_WIDTH_PX);
   // mainview.animate({'margin-left':'160px'},0.4)
    this.element.css("width",SIDEPANEL_WIDTH_PX);
    this.element.css("display"," block");

    this.opened = true;
    PageView.getInstance().mainview.resize();
}

SidePanel.prototype.close = function () {
    var mainview = $("#mainview");
    //mainview.animate({'margin-left':'0px'},0.4)
    mainview.css("margin-left"," 0px");
    this.element.css("display"," none");
    this.opened = false;
    PageView.getInstance().mainview.resize();
}

SidePanel.prototype.toggle = function(){
    if(this.opened){
        this.close();
    }else{
        this.open();
    }
}

SidePanel.prototype.addTab = function(element, name, closebutton){
    const self = this;
    if(closebutton == null){
        closebutton = true;
    }
    const tab = $("<div class='sidepanelbutton active w3-bar-item w3-button'></div>");
    var html = "<div class='buttontext'>"+name+"</div>";
    tab.html(html);
    tab.appendTo(this.tabSpace);

    const closeelem = $("<div class='closebutton'>&#10005;</div>");
    if(closebutton){
        closeelem.appendTo(tab);
    }

    const index = this.openTabs.push({
        page: element,
        tab: tab
    }) - 1;

    this.openTab(index);

    tab.click(function(event){
       if(event.target == closeelem[0]){
           tab.remove();
           PageView.getInstance().mainview.closeTab(element);
           self.openTab(0);
       }else {
           self.openTab(index);
       }
    });
}

SidePanel.prototype.addPlaylist = function(element, name){
    const self = this;

    const tab = $("<div class='sidepanelbutton active w3-bar-item w3-button'></div>");
    var html = "<div class='buttontext'>"+name+"</div>";
    tab.html(html);
    tab.appendTo(this.playlistSpace);

    const closeelem = $("<div class='closebutton'>&#10005;</div>");
    closeelem.appendTo(tab);

    const newTab = {
        page: element,
        tab: tab,
        close: null
    }
    const index = this.openTabs.push(newTab) - 1;

    newTab.close = function () {
        tab.remove(); // jQuery remove
        PageView.getInstance().mainview.closeTab(element); // removes mainview window
        if(self.openTabNum == index) {
            self.openTab(0);
        }
    }

    this.openTab(index);

    tab.click(function(event){
        if(event.target == closeelem[0]){
            /*tab.remove();
            PageView.getInstance().mainview.closeTab(element);
            self.openTab(0);*/
            newTab.close();
        }else {
            self.openTab(index);
        }
    });
}

/**
 *
 * @param page jquery element of mainview page
 * @param tab  jquery element of tab
 */
SidePanel.prototype.openTab = function(index, update){
    if(update == null){
        update = true;
    }
    var tab = this.openTabs[index];
    PageView.getInstance().mainview.hideAllTabs();
    this.openTabNum = index;
    tab.page.show(update);
    tab.page.resize();

    for(var i = 0; i < this.openTabs.length; i++){
        this.openTabs[i].tab.attr("class", "sidepanelbutton w3-bar-item w3-button");
    }
    tab.tab.attr("class", "sidepanelbutton active w3-bar-item w3-button ");

}

SidePanel.prototype.openTabByPage = function(element, update){
    var num = this.getTabNumByPage(element);
    if(num >= 0){
        this.openTab(num, update);
        return true;
    }
    return false;
}

SidePanel.prototype.getTabNumByPage = function(page){
    for(var i = 0; i < this.openTabs.length; i++){
        if(this.openTabs[i].page == page){
            return i;
        }
    }
    return -1;
}


