/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */


// ---------------------------------------------- CLASS SearchEngine ------------------------------------
/**
 * Forwards all searches to all registered plugins (when search is called)
 * @constructor
 */
function SearchEngine(){
    this.plugins = [];
}
/**
 * Register a plugin
 * A plugin at least has to have all functions of BaseSearchEngine - use the extend method
 * @param plugin {BaseSearchEngine}
 */
SearchEngine.prototype.addPlugin = function(plugin){
    this.plugins.push(plugin);
}
/**
 * Searches all plugins with the given query
 * @param query {String}
 * @param callback {function(SongArray)}
 * is called every time the results are updated (every time a plugin answered the query)
 * @returns {Array} the (empty) array that will be updated when the results arrive
 */
SearchEngine.prototype.search = function(query, callback){
    const results = new SongArray([]);
    const filtered = new SongArray([]);

    /**
     * Searches for double entries and appends the sources of one to the other
     */
    function filter(){
        for(let i = 0; i < results.length; i++){
            let found = false;
            let outer = results[i];
            for(let i2 = 0; i2 < filtered.length && !found; i2++){
                let inner = filtered[i2];
                if(outer.title == inner.title && outer.artist == inner.artist){
                    found = true;
                    for(let i3 = 0; i3 < outer.sources.length; i3++){
                        let sourceFound = false;
                        for(let i4 = 0; i4 < inner.sources.length; i4++){
                            if(inner.sources[i4].plugin == outer.sources[i3].plugin){
                                sourceFound = true;
                            }
                        }
                        if(! sourceFound){
                            inner.sources.push(outer.sources[i3]);
                        }
                    }
                }
            }
            if(! found){
                filtered.push(results[i]);
            }
        }
    }

    let numSearches = 0;
    for(let i = 0; i < this.plugins.length; i++){
        numSearches++;
        // for every search engine, add the found songs to the result set
        this.plugins[i].search(query, function(result){
            numSearches--;
            if(!(result instanceof  SongArray)){
                Log.error("Search result set no instance of SongArray");
                return;
            }
            for(let i2 = 0; i2 < result.length; i2++){
                if(!(result[i2] instanceof Song)){
                    Log.error("Search result no instance of Song");
                    return;
                }
                results.push(result[i2]);
            }
            filter();
            callback(filtered);
        });
    }
    // if searching takes longer than 5 seconds,
    // call the callback with an empty array and write a warning to the console
    window.setTimeout(function(){
        if(numSearches > 0) {
            callback(filtered);
            Log.warning("Search timed out");
        }
    }, 5000);

    return filtered;
}

// ---------------------------------------------- CLASS UrlPreview -----------------------------------------------------
/**
 * Manages UrlPreview Plugins
 * @constructor
 */
function UrlPreview(){
    this.plugins = [];
}

/**
 * Register a plugin
 * @param plugin {BaseUrlPreview}
 */
UrlPreview.prototype.addPlugin = function(plugin){
    this.plugins.push(plugin);
}

/**
 * @param element {jQuery} element to draw to (will be erased!)
 * @param url {string} url to preview
 * @param callback {function(object)} object has: title, artist, type, value
 * @returns {boolean} true if url is supported by a plugin, false if not
 */
UrlPreview.prototype.preview = function(element, url, callback){
    for(var i = 0; i < this.plugins.length; i++){
        if(this.plugins[i].supportsUrl(url)){
            this.plugins[i].preview(element, url, callback);
            return true;
        }
    }
    return false;
}

// ---------------------------------------------- CLASS CENTRAL --------------------------------------------------------
/**
 * Singleton class that handles all internal (model in MVC) classes
 * @returns {Central}
 * @constructor
 */
function Central() {

    this.player = new MusicPlayer();
    this.search = new SearchEngine();
    this.urlPreview = new UrlPreview();

    return this;
}

Central.instance = null;
/**
 * Get the instance
 * @returns {Central}
 */
Central.getInstance = function () {
    if (Central.instance === null) {
        Central.instance = new Central();
    }
    return Central.instance;
}
/**
 * Static getter for MusicPlayer
 * @returns {MusicPlayer}
 */
Central.getPlayer = function () {
    return Central.getInstance().player;
}
/**
 * Static getter for SearchEngine
 * @returns {SearchEngine}
 */
Central.getSearch = function(){
    return Central.getInstance().search;
}
/**
 * Static getter for UrlPreview
 * @returns {UrlPreview}
 */
Central.getUrlPreview = function(){
    return Central.getInstance().urlPreview;
}


