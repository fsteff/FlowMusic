/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

class Song{
    constructor(id, title, artist, sources, albums, tags, year) {
        this.id = parseInt(id);
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

class Source{
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


class Album{
    constructor(value) {
        if (typeof value == 'string') {
            this.artist = null;
            this.name = value;
        } else {
            this.artist = (typeof value.artist == 'string') ? value.artist : null;
            this.name = (typeof value.name == 'string') ? value.name : "";
        }
    }

    toOneString(){
        if(this.artist != null){
            return this.artist + ": " + this.name;
        }else{
            return this.name;
        }
    }
}

class SongArray extends Array{
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

    get(index){
        if(this[index] instanceof Song){
            return this[index];
        }else{
            return null;
        }
    }

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


class SourceArray extends Array{
    constructor(sources){
        super();
        const self = this;
        if(! isArray(sources)){
            Log.error("SourceArray: is no array");
            return;
        }

        sources.forEach(function(entry){
            if(typeof entry.type === 'string' && entry.type.toLowerCase() === 'local'){
                self.push(new Source(entry.type, entry.sourceid));
            }else{
                self.push(new Source(entry.type, entry.value));
            }
        });
    }

    get(index){
        if(this[index] instanceof Source){
            return this[index];
        }else{
            return null;
        }
    }
}


class AlbumArray extends Array{


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

    get(index){
        if(this[index] instanceof Album){
            return this[index];
        }else{
            return null;
        }
    }

    toOneString(){
        if(this.oneString === null) {
            let str = "";
            this.forEach(function (album, index) {
                if (index != 0) {
                    str += ", ";
                }
                str += album.toOneString();
            });
            this.oneString = str;
        }
        return this.oneString;
    }
}

class TagArray extends Array{
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

    get(index){
        if(typeof this[index] == 'string'){
            return this[index];
        }else{
            return null;
        }
    }
}
