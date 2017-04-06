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

SidePanel.prototype.addTab = function(element, name, closebutton){
    if(closebutton == null){
        closebutton = true;
    }
    const tab = $("<div class='w3-bar-item w3-button sidepanelbutton'></div>");
    var html = "<div class='buttontext'>"+name+"</div>";
    tab.html(html);
    tab.appendTo(this.element);

    const closeelem = $("<div class='closebutton'>&#10005;</div>");
    if(closebutton){
        closeelem.appendTo(tab);
    }

    this.openTabs.push({
        page: element,
        tab: tab
    });

    const elem = this.element;
    tab.click(function(event){
       if(event.target == closeelem[0]){
           tab.remove();
           PageView.getInstance().mainview.closeTab(element);
       }else {
           PageView.getInstance().mainview.hideAllTabs();
           element.show();
           element.resize();
       }
    });

    PageView.getInstance().mainview.hideAllTabs();
    element.show();
    element.resize();
}

