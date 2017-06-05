/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

const SIDEPANEL_WIDTH = 160;
const SIDEPANEL_WIDTH_PX = SIDEPANEL_WIDTH+"px";

/**
 * View for the side panel (green bar at the left)
 * @constructor
 */
function SidePanel(){
    const self = this;
    this.element = $("#sidepanel");
    this.opened = false;
    // currently open tab
    this.openTabNum = 0;

    this.openTabs = [];

    // div for general purpose tabs
    this.tabSpace = $("<div id='sidepanel-tabSpace'></div>");
    this.tabSpace.appendTo(this.element);
    this.tabSpace.height(this.element.height()/2);

    // div for PlaylistView tabs
    this.playlistSpace = $("<div></div>");
    this.playlistSpace.appendTo(this.element);

    const playlistsTab = $('<div class="sidepanelbutton active w3-bar-item w3-button" ' +
        'id="sidepanel-playlists">Playlists</div>');
    playlistsTab.appendTo(this.playlistSpace);

    // holds the PlaylistOverview MainTab
    this.playlists = {
        page: null, // MainTab - is set a bit later by PageView (outside its constructor)
        tab: playlistsTab
    }

    // tab number of the PlayQueue tab - this is (normally) set to 0 by PageView after it has created it
    this.queueTabIndex = -1;

    // tab number of the PlaylistOverview
    const index = this.openTabs.push(this.playlists) - 1; //  -> always 0

    // add click handler to playlist overview tab:
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

/**
 * Resizes the side panel to fit the page
 */
SidePanel.prototype.resize = function(){
    this.tabSpace.height(this.element.height()/2);
}
/**
 * Shows the sidepanel
 */
SidePanel.prototype.open = function () {
    var mainview = $("#mainview");
    mainview.css("margin-left", SIDEPANEL_WIDTH_PX);
   // mainview.animate({'margin-left':'160px'},0.4)
    this.element.css("width",SIDEPANEL_WIDTH_PX);
    this.element.css("display"," block");

    this.opened = true;
    PageView.getInstance().mainview.resize();
}
/**
 * Hides the sidepanel
 */
SidePanel.prototype.close = function () {
    var mainview = $("#mainview");
    mainview.css("margin-left"," 0px");
    this.element.css("display"," none");
    this.opened = false;
    PageView.getInstance().mainview.resize();
}

/**
 * Toggles the sidepanel (opens it is it is closed, closes it it is opened)
 */
SidePanel.prototype.toggle = function(){
    if(this.opened){
        this.close();
    }else{
        this.open();
    }
}

/**
 * Adds a new general purpose Tab (called by MainView.newTab)
 * @param mainTab {MainTab} (subclass of MainTab)
 * @param name {string} displayed name
 * @param closeButton {boolean} if the tab should have a close button
 * @return {number} the tab number of the newly created tab
 */
SidePanel.prototype.addTab = function(mainTab, name, closeButton){
    const self = this;
    if(closeButton !== false){
        closeButton = true;
    }
    const tab = $("<div class='sidepanelbutton active w3-bar-item w3-button'></div>");
    var html = "<div class='buttontext'>"+name+"</div>";
    tab.html(html);
    tab.appendTo(this.tabSpace);

    const closeElem = $("<div class='closebutton'>&#10005;</div>");
    if(closeButton){
        closeElem.appendTo(tab);
    }

    const index = this.openTabs.push({
        page: mainTab,
        tab: tab
    }) - 1;

    this.openTab(index);

    tab.click(function(event){
       if(event.target == closeElem[0]){
           tab.remove();
           PageView.getInstance().mainview.closeTab(mainTab);
           self.openTab(self.queueTabIndex);
       }else {
           self.openTab(index);
       }
    });
    return index;
}

/**
 * Adds a new PlaylistView Tab (called by MainView.newTab)
 * @param mainTab {PlaylistView}
 * @param name {string} display name
 * @return {number} the tab number of the newly created tab
 */
SidePanel.prototype.addPlaylist = function(mainTab, name){
    const self = this;

    const tab = $("<div class='sidepanelbutton active w3-bar-item w3-button'></div>");
    var html = "<div class='buttontext'>"+name+"</div>";
    tab.html(html);
    tab.appendTo(this.playlistSpace);

    const closeelem = $("<div class='closebutton'>&#10005;</div>");
    closeelem.appendTo(tab);

    const newTab = {
        page: mainTab,
        tab: tab,
        close: null
    }
    const index = this.openTabs.push(newTab) - 1;

    newTab.close = function () {
        tab.remove(); // jQuery remove
        PageView.getInstance().mainview.closeTab(mainTab); // removes mainview window
        if(self.openTabNum == index) {
            self.openTab(0);
        }
    }

    this.openTab(index);

    tab.click(function(event){
        if(event.target == closeelem[0]){
            newTab.close();
        }else {
            self.openTab(index);
        }
    });
    return index;
}

/**
 * Shows a MainTab of the given tab number/index
 * @param index {number} of the tab
 * @param update {boolean} if the MainTab should be updated (optional)
 */
SidePanel.prototype.openTab = function(index, update){
    if(update !== false){
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

/**
 * Shows a the tab with the given MainTab instance
 * @param element {MainTab}
 * @param update {boolean} if the MainTab should be updated
 * @return {boolean} if tab was found
 */
SidePanel.prototype.openTabByPage = function(element, update){
    var num = this.getTabNumByPage(element);
    if(num >= 0){
        this.openTab(num, update);
        return true;
    }
    return false;
}

/**
 * Returns the tab number of a MainTab instance
 * @param mainTab {MainTab}
 * @return {number} index of the sidepanel tab or -1 if it was not found
 */
SidePanel.prototype.getTabNumByPage = function(mainTab){
    for(var i = 0; i < this.openTabs.length; i++){
        if(this.openTabs[i].page == mainTab){
            return i;
        }
    }
    return -1;
}


