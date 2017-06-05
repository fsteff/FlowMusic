/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

/**
 * Singleton class that holds the view components - use getInstance()
 * @return {PageView}
 * @constructor
 */
function PageView(){
    this.playbar = new PlayBar();
    this.mainview = new MainView();
    this.sidepanel = new SidePanel();

    $("#mainview-sidepanel-button").click(function(){
       PageView.getInstance().sidepanel.toggle();
    });
    return this;
}

PageView.instance = null;

/**
 * Singleton getter
 * @return {PageView}
 */
PageView.getInstance = function(){
    if(PageView.instance === null){
        PageView.instance = new PageView();
    }
    return PageView.instance;
}

// on document.ready build the page
$(document).ready(function(){

    const view = PageView.getInstance();
    if($(window).width() > 800){
        view.sidepanel.open();
    }else{
        view.sidepanel.close();
    }

    $(window).resize(function(){
        const width = $(window).width();
        if(width > 800){
            view.sidepanel.open();
        }else{
            view.sidepanel.close();
        }

        view.mainview.resize();
        view.sidepanel.resize();
    });

    // add the playQueue Tab
    const queue = view.mainview.newTab(PlayQueueView, "Queue", false);
    view.sidepanel.queueTabIndex = queue.tabIndex;

    // add the PlaylistOverviewTab
    const elem = $('<div class="maintab"></div>');
    elem.appendTo(view.mainview.element);
    elem.hide();
    const page = extend(MainTab, PlaylistOverview, elem, elem);
    view.sidepanel.playlists.page = page;
    view.mainview.tabs.push(page);
    // load the playlist overview a bit later
    window.setTimeout(page.update, 200);

});
