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
        this.isEmpty = true;
        this.data = [];
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
        const self = this;
        let html = "";
            if (this.title !== null) {
                html += "<h3>" + this.title + "</h3>";
            }
            html += "</h3><table class='w3-table songTable'><tr>";
            for (var i = 0; i < this.head.length; i++) {
                if (this.head[i].visible) {
                    html += "<th>" + this.head[i].name + "</th>";
                }
            }
            html += "</tr></table>";
            this.jQElement.html(html);
            this.isEmpty = false;


        const tableBody = this.jQElement.find("tbody");
        const threadState = {row: 0};

        function threadFoo(){
            const startTime = performance.now();
            for (; threadState.row < data.length
                   && performance.now() - startTime < 100; threadState.row++) {
                /**
                 * @type Song
                 */
                const song = data[threadState.row];
                var rowelem = $("<tr class='tablerow'></tr>");
                html = "";
                for (var col = 0; col < self.head.length; col++) {
                    if (self.head[col].visible) {
                        switch (self.head[col].name) {
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
                tableBody.append(rowelem);


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
            }
            if (threadState.row >= data.length){
                return true;
            }else{
                return false;
            }
        }
        if(data.length > 0) {
            const thread = new FakeThread(threadFoo, 150, 10);
            thread.start();
        }
    }
}
