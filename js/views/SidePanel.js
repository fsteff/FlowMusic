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
    const self = this;
    if(closebutton == null){
        closebutton = true;
    }
    const tab = $("<div class='sidepanelbutton active w3-bar-item w3-button'></div>");
    var html = "<div class='buttontext'>"+name+"</div>";
    tab.html(html);
    tab.appendTo(this.element);

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

/**
 *
 * @param page jquery element of mainview page
 * @param tab  jquery element of tab
 */
SidePanel.prototype.openTab = function(index){
    var tab = this.openTabs[index];
    PageView.getInstance().mainview.hideAllTabs();
    tab.page.show();
    tab.page.resize();

    for(var i = 0; i < this.openTabs.length; i++){
        this.openTabs[i].tab.attr("class", "sidepanelbutton w3-bar-item w3-button");
    }
    tab.tab.attr("class", "sidepanelbutton active w3-bar-item w3-button ");
}

