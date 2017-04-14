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
 * A plugin at least hast to have all functions of BaseSearchEngine - use the extend method
 * @param plugin
 */
SearchEngine.prototype.addPlugin = function(plugin){
    this.plugins.push(plugin);
}
/**
 * Searches songs by calling all plugins
 * @param (string) query
 * @returns Array of found songs
 */
SearchEngine.prototype.search = function(query){
    var results = [];

    for(var i = 0; i < this.plugins.length; i++){
        var res = this.plugins[i].search(query);
        for(var i2 = 0; i2 < res.length; i2++){
            results.push(res[i2]);
        }
    }

    var filtered = [];

    // Search for double entries and append the sources of one to the other
    for(var i = 0; i < results.length; i++){
        var found = false;
        var outer = results[i];
        for(var i2 = 0; i2 < filtered.length && !found; i2++){
            var inner = filtered[i2];
            if(outer.title == inner.title && outer.artist == inner.artist){
                found = true;
                for(var i3 = 0; i3 < outer.sources.length; i3++){
                    var sourceFound = false;
                    for(var i4 = 0; i4 < inner.sources.length; i4++){
                        if(inner.sources[i4].plugin == outer.sources[i3].plugin){
                            sourceFound = true;
                        }
                    }
                    if(! sourceFound){
                        inner.sources[inner.sources.length] = outer.sources[i3];
                    }
                }
            }
        }
        if(! found){
            filtered[filtered.length] = results[i];
        }
    }

    return filtered;
}

// ---------------------------------------------- CLASS Verifier -------------------------------------------------------
/**
 * This class forwards "add title" input to all registered plugins
 * (when verify is called)
 * @constructor
 */
function Verifier(){
    this.plugins = [];
}
/**
 * Register a plugin - (Base class is TODO)
 * @param plugin
 */
Verifier.prototype.addPlugin = function(plugin){
    this.plugins.push(plugin);
}

Verifier.prototype.verify = function(url){
    var results = [];
    for(var i = 0; i < this.plugins.length; i++){
        var res = this.plugins[i].verify(url);
        if(res != null){
            results.push(res);
        }
    }
    return results;
}

// ---------------------------------------------- CLASS CENTRAL --------------------------------------------------------
/**
 * Singleton class that handles all internal (model in MVC) classes
 * @returns {Central}
 * @constructor
 */
function Central() {
    this.verifier = new Verifier();
    this.player = new MusicPlayer();
    this.search = new SearchEngine();
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
 * @returns {MusicPlayer}
 */
Central.getPlayer = function () {
    return Central.getInstance().player;
}
/**
 * @returns {SearchEngine}
 */
Central.getSearch = function(){
    return Central.getInstance().search;
}
/**
 * @returns {Verifier}
 */
Central.getVerifier = function(){
    return Central.getInstance().verifier;
}

