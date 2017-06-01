/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
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

PageView.getInstance = function(){
    if(PageView.instance === null){
        PageView.instance = new PageView();
    }
    return PageView.instance;
}

$(document).ready(function(){
   /* $("body").height($(window).height());
    $("body").width($(window).width());*/

    var view = PageView.getInstance();
    if($(window).width() > 800){
        view.sidepanel.open();
    }else{
        view.sidepanel.close();
    }

    $(window).resize(function(){
        var width = $(window).width();
        if(width > 800){
            view.sidepanel.open();
        }else{
            view.sidepanel.close();
        }

        view.mainview.resize();
        view.sidepanel.resize();
    });


    view.mainview.newTab(PlayQueueView, "Queue", false);

    const elem = $('<div class="maintab"></div>');
    elem.appendTo(PageView.getInstance().mainview.element);
    elem.hide();
    const page = extend(MainTab, PlaylistOverview, elem, elem);
    view.sidepanel.playlists.page = page;
    view.mainview.tabs.push(page);
    page.update();

});
