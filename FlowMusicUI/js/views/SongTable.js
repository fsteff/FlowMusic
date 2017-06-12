/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 *
 * Note to this file: this is ECMAScript 6
 * Only modern browsers support this!
 * (Most parts of the project are conventional javascript - this was created later)
 */

/**
 * This class draws a table of songs, with the ability to create a context menu on right click.
 * The context menu has following options:
 * - play now (add to playqueue and play instantly)
 * - add to playqueue
 * - add to playlist (which opens another context menu for selecting the playlist)
 */
class SongTable {
    /**
     * Creates an empty table
     * @param jQElement {HTMLElement} jQuery element or id
     * @param title {String} heading
     * @param head {Array} configuration of the columns, has to have (order matters):
     * default (if head == null):
     * [{
     *    name: "Artist",
     *    visible: true
     * }, {
     *    name: "Title",
     *    visible: true,
     * }, {
     *    name: "Album",
     *    visible: false
     * }, {
     *    name: "Tags",
     *    visible: false
     * }];
     * @constructor
     */
    constructor(jQElement, title, head) {
        this.jQElement = $(jQElement);
        this.title = title;
        if(title !== null && title.trim() !== "") {
            this.jQElement.html("<h3>" + title + "</h3><i>loading...</i>");
        }
        this.data = [];
        if (isArray(head)) {
            this.head = head;
        } else {
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
     * Draws the table data
     * @param songArray {SongArray}
     */
    update(songArray) {
        const self = this;
        const data = songArray
        let html = "";
        if (this.title !== null && this.title.trim() !== "") {
            html += "<h3>" + this.title + "</h3>";
        }
        html += "</h3><table class='w3-table songTable'><tr>";
        for (let i = 0; i < this.head.length; i++) {
            if (this.head[i].visible) {
                html += "<th>" + this.head[i].name + "</th>";
            }
        }
        html += "</tr></table>";
        this.jQElement.html(html);

        const tableBody = this.jQElement.find("tbody");
        const threadState = {row: 0};

        /**
         * Worker function for FakeThread
         * @return {boolean} true if it is finished
         */
        function threadFoo() {
            const startTime = performance.now();
            // after 100ms take a break and let the UI do its work
            for (; threadState.row < data.length
                   && performance.now() - startTime < 100; threadState.row++) {
                /**
                 * @type Song
                 */
                const song = data[threadState.row];
                const rowelem = $("<tr class='tablerow'></tr>");
                html = "";
                for (let col = 0; col < self.head.length; col++) {
                    if (self.head[col].visible) {
                        switch (self.head[col].name) {
                            case "Artist":
                                html += "<td>" + song.artist + "</td>";
                                break;
                            case "Title":
                                html += "<td>" + song.title + "</td>";
                                break;
                            case "Album":
                                html += "<td>" + song.albums.toOneString() + "</td>";
                                break;
                            case "Tags":
                                // TODO: implement tags
                                break;
                        }
                    }
                }
                rowelem.html(html);
                tableBody.append(rowelem);

                /**
                 * This is called on click "add to playlist ..." in the context menu
                 */
                function choosePlaylist() {
                    /**
                     * @type {PlaylistOverview}
                     */
                    const overview = PageView.getInstance().sidepanel.playlists.page;
                    /**
                     * @type {Array}
                     */
                    const playlists = overview.playlists;
                    const ctx = new ContextMenu();
                    ctx.addLabel("Choose a playlist:");

                    playlists.forEach(function (pl) {
                        const playlist = pl;
                        ctx.addProperty(pl.name, function () {
                            LocalComm.newMessage({
                                command: "addSongToPlaylist",
                                songid: song.id,
                                playlistid: playlist.id
                            }, Message.Components.DATABASE, function(){
                                overview.update();
                            });
                        });
                    });
                }

                // add context menu listener
                $(rowelem).contextmenu(function () {
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

                    // do not open default context menu
                    return false;
                });
            }
            if (threadState.row >= data.length) {
                return true;
            } else {
                return false;
            }
        }

        // Create FakeThread to ensure the UI keeps responsive if the table is large
        if (data.length > 0) {
            // maximum 150ms per call (or a warning is generated)
            // 10 ms pause to update UI
            const thread = new FakeThread(threadFoo, 150, 10);
            thread.start();
        }
    }
}
