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
 * Searches all plugins with the given query
 * @param query
 * @param callback is called every time the results are updated (every time a plugin answered the query)
 * @returns {Array} the (empty) array that will be updated when the results arrive
 */
SearchEngine.prototype.search = function(query, callback){
    const results = [];
    const filtered = [];

    function filter(){
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
    }

    for(var i = 0; i < this.plugins.length; i++){
        this.plugins[i].search(query, function(result){
            for(var i2 = 0; i2 < result.length; i2++){
                results.push(result[i2]);
            }
        });
        filter();
        callback(filtered);
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

// ---------------------------------------------- CLASS Message --------------------------------------------------------
/**
 *
 * @param obj
 * Either an incoming json string as obj.json = "..."
 * or the object's members:
 * - id
 * - answer to // an other messages' id
 * - recipient
 * - sender
 * - msg (JSON String or JS Object)
 * defined (if id is not defined, it is randomly chosen)
 * @constructor
 */
function Message(obj){
    if(obj !== null && obj.json !== null &&
        (typeof obj.json === 'string' || obj.json instanceof String)){
        obj = JSON.parse(obj.json);
    }

    if((typeof obj.id !== 'undefined') && obj.id !== null){
        this.id = obj.id;
    }else{
        // use random id, because good synchronisation of incrementing the id is impossible
        this.id = Math.floor(Math.random()*10000000+1);
    }

    if((typeof obj.answerTo !== 'undefined') && obj.answerTo !== null){
        this.answerTo = obj.answerTo;
    }else{
        this.answerTo = 0;
    }

    if((typeof obj.recipient !== 'undefined') && obj.recipient !== null){
        this.recipient = obj.recipient;
    }else{
        this.recipient = Message.Components.ANY;
    }

    if((typeof obj.sender !== 'undefined') && obj.sender !== null){
        this.sender = obj.sender;
    }else{
        this.sender = Message.Components.GUI;
    }

    if((typeof obj.msg !== 'undefined') && obj.msg !== null){
        this.msg = obj.msg;
        if(typeof this.msg === 'string' || this.msg instanceof String){
            this.msg = JSON.parse(this.msg);
        }
    }else{
        this.msg = {};
    }

}

Message.Components = {
    ANY : "ANY",
    WEBSERVER : "WEBSERVER",
    DATABASE : "DATABASE",
    GUI : "GUI",
    CRAWLER : "CRAWLER"
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



