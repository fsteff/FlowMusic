/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

/**
 *
 * @param jQElement {HTMLElement}
 * @param title {String}
 * @param head {Array}
 * @constructor
 */
class SongTable{
    constructor(jQElement, title, head) {
        /**
         * @type {HTMLElement}
         */
        this.jQElement = $(jQElement);
        this.title = title;
        this.jQElement.html("<h3>" + title + "</h3>");
        this.data = null;
        if(isArray(head)) {
            this.head = head;
        }else{
            this.head = [
                {
                    name: "Artist",
                    visible: true
                }, {
                    name: "Title",
                    visible: true,
                }, {
                    name: "Album",
                    visible: false
                }, {
                    name: "Tags",
                    visible: false
                }
            ];
        }
    }

    /**
     *
     * @param data {SongArray}
     */
    update(data) {
        let html = "";
        if(this.title !== null){
            html += "<h3>"+this.title+"</h3>";
        }
        html += "</h3><table class='w3-table songTable'><tr>";
        for (var i = 0; i < this.head.length; i++) {
            if (this.head[i].visible) {
                html += "<th>" + this.head[i].name + "</th>";
            }
        }
        html += "</tr></table>";
        this.jQElement.html(html);

        for (var row = 0; row < data.length; row++) {
            /**
             * @type Song
             */
            const song = data[row];
            var rowelem = $("<tr class='tablerow'></tr>");
            html = "";
            for (var col = 0; col < this.head.length; col++) {
                if (this.head[col].visible) {
                    switch (this.head[col].name) {
                        case "Artist":
                            html += "<td>" + song.artist + "</td>";
                            break;
                        case "Title":
                            html += "<td>" + song.title + "</td>";
                            break;
                        case "Album":
                            html += "<td>"+song.albums.toOneString()+ "</td>";
                            break;
                        case "Tags":
                            // TODO: implement tags
                            break;
                    }
                }
            }
            rowelem.html(html);

            const addToQueue = function(play){
                const playable = [];
                const state = {
                    countDown: 0,
                    finished: false
                }

                function choose(){
                    let chosen = -1;
                    for(let i2 = 0; i2 < song.sources.length && chosen < 0; i2++){
                        if(playable[i2] === true){
                            chosen = i2;
                        }
                    }
                    if(chosen >= 0) {
                        const s = {
                            artist: song.artist,
                            title: song.title,
                            plugin: song.sources.get(chosen).type,
                            source: song.sources.get(chosen).value
                        };
                        Central.getPlayer().getPlayQueue().add(s);
                        if(play) {
                            Central.getPlayer().playSong(s);
                        }
                    }else{
                        Log.warning("Cannnot get a valid source for "+JSON.stringify(elem));
                    }
                }

                for(let i = 0; i < song.sources.length; i++){
                    const src = song.sources[i];
                    state.countDown++;
                    Central.getPlayer().tryLoadSource(src.type,  src.value, function(valid){
                        playable[i] = valid;
                        state.countDown--;

                        if(state.countDown === 0 && state.finished){
                            choose();
                        }
                    });

                };
                state.finished = true;

                // if all callbacks returned immediately
                if(state.countDown == 0){
                    choose();
                }
            }

            function choosePlaylist(){
                const overview = PageView.getInstance().sidepanel.playlists.page;
                const playlists = overview.playlists;
                const ctx = new ContextMenu();
                ctx.addLabel("Choose a playlist:");
                playlists.forEach(function(pl){
                    const playlist = pl;
                    ctx.addProperty(pl.name, function(){
                        LocalComm.newMessage({
                            command: "addSongToPlaylist",
                            songid: song.id,
                            playlistid: playlist.id
                        }, Message.Components.DATABASE);
                    });
                });
            }

            $(rowelem).contextmenu(function (elem) {
                const ctx = new ContextMenu();
                ctx.addProperty("play now", function () {
                    addToQueue(true);
                });

                ctx.addProperty("add to playQueue", function () {
                    addToQueue(false);
                });

                const addToPlaylist = "<div class='expand'>add to playlist ...</div>";
                ctx.addProperty(addToPlaylist, function () {
                    // return the "click" handler before crating new ContextMenu
                    window.setTimeout(choosePlaylist, 1);
                });

                return false;
            });



            this.jQElement.find("tbody").append(rowelem);
        }
    }
}
