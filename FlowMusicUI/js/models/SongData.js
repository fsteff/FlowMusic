/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

class Song{
    constructor(title, artist, sources, albums, tags) {
        /**
         * @type {string}
         */
        this.title = (typeof title == 'string') ? title : "";
        /**
         * @type {string}
         */
        this.artist = (typeof artist == 'string') ? artist : "";
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
        this.value = (typeof value == 'string') ? value : "";
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
                    entry.title,
                    entry.artist,
                    new SourceArray(entry.sources),
                    // TODO: change protocol to album, tags
                    new AlbumArray(entry.album),
                    new TagArray(entry.tag)
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
            self.push(new Source(entry.type, entry.value));
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
