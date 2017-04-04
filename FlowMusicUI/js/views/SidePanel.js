const SIDEPANEL_WIDTH = 160;
const SIDEPANEL_WIDTH_PX = SIDEPANEL_WIDTH+"px";

function SidePanel(){
    this.element = $("#sidepanel");
    this.opened = false;

    this.openTabs = [];
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

SidePanel.prototype.addTab = function(element, name){
    var tab = $("<div class='w3-bar-item w3-button'>"+name+"</div>");
    tab.appendTo(this.element);
    this.openTabs.push({
        page: element,
        tab: tab
    });
    tab.click(function(){
       PageView.getInstance().mainview.hideAllTabs();
       element.show();
       element.resize();
    });

    PageView.getInstance().mainview.hideAllTabs();
    element.show();
    element.resize();
}

