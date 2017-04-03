function Youtube(){ extend(Youtube, BaseMusicPlayer, this);
    this.name = "youtube";
    $("body").append("<div id='yt-frame'></div>")

}

Central.getPlayer().addPlugin(new Youtube());

