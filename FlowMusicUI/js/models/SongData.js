/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 *
 * Note to this file: this is ECMAScript 6
 * Only modern browsers support this!
 * (Most parts of the project are conventional javascript - this was created later)
 */

/**
 * Class that represents a song
 */
class Song{
    /**
     * Initializes the class
     * @param id {number|string} id or string containing the id
     * @param title {string} song title
     * @param artist {string} artist name
     * @param sources {SourceArray} array of sources
     * @param albums {AlbumArray} array of albums
     * @param tags {TagArray} array of tags
     * @param year {number|string} year of creation, or string containing it
     * @constructor
     */
    constructor(id, title, artist, sources, albums, tags, year) {
        /**
         * @type {Number}
         */
        this.id = parseInt(id);
        /**
         * @type {Number}
         */
        this.year = parseInt(year);
        /**
         * @type {string}
         */
        this.title = (typeof title == 'string') ? title : "ERROR";
        /**
         * @type {string}
         */
        this.artist = (typeof artist == 'string') ? artist : "ERROR";
        /**
         * @type {SourceArray}
         */
        this.sources = (isArray(sources)) ? sources : new SourceArray([]);
        /**
         * @type {AlbumArray}
         */
        this.albums = (isArray(albums)) ? albums : new AlbumArray([]);
        /**
         * @type {TagArray}
         */
        this.tags = (isArray(tags)) ? tags : new TagArray([]);

    }
}
/**
 * Represents an audio source
 */
class Source{
    /**
     * Initializes the source
     * @param type {string} music player plugin name
     * @param value {*} url, song/video Id ,...
     * @constructor
     */
    constructor(type, value){
        /**
         * @type {string}
         */
        this.type = (typeof type == 'string') ? type : "";
        /**
         * @type {string}
         */
        this.value = (typeof value == 'string' || typeof value == 'number') ? value : "";
    }
}

/**
 * Represents an album
 */
class Album{
    /**
     * Initalizes the class
     * @param value {string|object} either only album name or object of thre form
     * {artist: (name of the artist), name (album name)}
     */
    constructor(value) {
        if (typeof value == 'string') {
            this.artist = null;
            this.name = value;
        } else {
            this.artist = (typeof value.artist == 'string') ? value.artist : null;
            this.name = (typeof value.name == 'string') ? value.name : "";
        }
    }

    /**
     * Creates a single string describing the album
     * @return {string}
     */
    toOneString(){
        if(this.artist != null){
            return this.artist + ": " + this.name;
        }else{
            return this.name;
        }
    }
}
/**
 * Array containing Song instances
 * @extends Array
 */
class SongArray extends Array{
    /**
     * Initializes the SongArray
     * @param arr {Array} in the form it is sent by the DATABASE component
     * @constructor
     */
    constructor(arr){
        super();
        const self = this;
        if(! isArray(arr)){
            Log.error("SongArray: is no array");
            return;
        }

        arr.forEach(function(entry){
            self.push(
                new Song(
                    entry.songid,
                    entry.title,
                    entry.artist,
                    new SourceArray(entry.sources),
                    // TODO: change protocol to albums, tags
                    new AlbumArray(entry.album),
                    new TagArray(entry.tag),
                    entry.year
                ))
        });
    }

    /**
     * Getter that does return null instead of 'undefined' elements if not found
     * @param index {number}
     * @return {Song}
     */
    get(index){
        if(this[index] instanceof Song){
            return this[index];
        }else{
            return null;
        }
    }

    /**
     * Sorts the array either by title, artist or album
     * @param by {string} "title" | "artist" | "album"
     * @return {SongArray}
     */
    sortBy(by){
        let type = 0;
        switch(by){
            case "title":
                return this.sort(function(a, b){
                    let valA = a.title;
                    let valB = b.title;

                    valA = (typeof valA === 'string') ? valA : "";
                    valB = (typeof valB === 'string') ? valB : "";

                    return valA.localeCompare(valB);
                });
                break;
            case "artist":
                return this.sort(function(a, b){
                    let valA = a.artist;
                    let valB = b.artist;

                    valA = (typeof valA === 'string') ? valA : "";
                    valB = (typeof valB === 'string') ? valB : "";

                    return valA.localeCompare(valB);
                });
                break;
            case "album":
                return this.sort(function(a, b){
                    let valA = a.albums.toOneString();
                    let valB = b.albums.toOneString();

                    valA = (typeof valA === 'string') ? valA : "";
                    valB = (typeof valB === 'string') ? valB : "";

                    return valA.localeCompare(valB);
                });
            default:
                Log.error("Unimplemented search type: " + by);
                return null;
        }
    }
}

/**
 * Array of Source instances
 * @extends Array
 */
class SourceArray extends Array{
    /**
     * Initializes the SourceArray
     * @param sources {Array} in the form it is sent by the DATABASE component
     */
    constructor(sources){
        super();
        const self = this;
        if(! isArray(sources)){
            Log.error("SourceArray: is no array");
            return;
        }

        sources.forEach(function(entry){
            if(typeof entry.type === 'string' && entry.type.toLowerCase() === 'local'){
                // for sources of type local do not use the path but the source id
                self.push(new Source(entry.type, entry.sourceid));
            }else{
                self.push(new Source(entry.type, entry.value));
            }
        });
    }

    /**
     * Getter that returns null instead of 'undefined' if not found
     * @param index {number}
     * @return {Source}
     */
    get(index){
        if(this[index] instanceof Source){
            return this[index];
        }else{
            return null;
        }
    }
}

/**
 * Array of Album instances
 * @extends Array
 */
class AlbumArray extends Array{
    /**
     * Initializes the AlbumArray
     * @param arr {Array} as returned by the DATABASE component
     */
    constructor(arr){
        super();
        const self = this;
        this.oneString = null;
        if(! isArray(arr)){
            Log.error("SourceArray: is no array");
            return;
        }

        arr.forEach(function(entry){
            self.push(new Album(entry));
        });
    }

    /**
     * Getter that returns null instead of 'undefined' if not found
     * @param index {number}
     * @return {Album}
     */
    get(index){
        if(this[index] instanceof Album){
            return this[index];
        }else{
            return null;
        }
    }

    /**
     * Returns a string representation of Albums in the Array
     * @return {string}
     */
    toOneString(){
        if(this.oneString === null) {
            let str = "";
            this.forEach(function (album, index) {
                if(album !== null && album.toOneString().trim() !== "") {
                    if (index != 0) {
                        str += ", ";
                    }
                    str += album.toOneString();
                }
            });
            this.oneString = str;
        }
        return this.oneString;
    }
}

/**
 * Array of tags (tags are simply strings(fow now))
 */
class TagArray extends Array{
    /**
     * Initializes the TagArray
     * @param arr {Array} array of strings
     */
    constructor(arr){
        super();

        const self = this;
        if(! isArray(arr)){
            Log.error("SourceArray: is no array");
            return;
        }

        arr.forEach(function(entry){
            if(typeof entry == 'string'){
                self.push(entry);
            }
        });
    }

    /**
     * Getter that returns null instead of 'undefined' if not found
     * @param index
     * @return {*}
     */
    get(index){
        if(typeof this[index] == 'string'){
            return this[index];
        }else{
            return null;
        }
    }
}
