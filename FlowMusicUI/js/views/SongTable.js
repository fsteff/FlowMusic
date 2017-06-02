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
                    Central.getPlayer().addToQueue(song, true);
                });

                ctx.addProperty("add to playQueue", function () {
                    Central.getPlayer().addToQueue(song, false);
                });

                const addToPlaylist = "add to playlist ...";
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
