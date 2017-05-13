/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

function LocalComm(){
    const self = this;
    this.messageCallbacks = new Map();
    this.listeners = new Map();

    this.onMessage = function(data){
        if(data !== "{}") {
            var msg = new Message({json: data});
            var answerTo = msg.answerTo;
            if ((typeof answerTo !== 'undefined')
                && (answerTo !== null && answerTo > 0)
                && self.messageCallbacks.get(answerTo) !== null)
            {
                self.messageCallbacks.get(answerTo)(msg.msg);
                self.messageCallbacks.remove(answerTo);
                Log.info("Message from " + msg.sender + ": " + JSON.stringify(msg.msg));
            } else {
                self.processMessage(msg);
            }
        }
        self.getMessage();
    }

    this.getMessage = function(){
        $.ajax({
            url: "/inmsg",
            success: self.onMessage,
            error: function( jqXHR, textStatus, errorThrown ){
                Log.error("GET /inmsg (Message-Polling) failed: " + errorThrown);
                window.setTimeout(self.getMessage, 5000);
            },
            timeout: 6000
        });
    }

    this.processMessage = function(msg){

        if(msg.json.trim() !== "{}") {
            if (msg === null || typeof msg.msg === 'undefined' || msg.msg === null) {
                Log.debug("Message invalid: " + JSON.stringify(msg))
                return;
            }
            const m = msg.msg;
            if (typeof m.command !== 'string' || m.command === null) {
                Log.debug("Message does not contain command: " + JSON.stringify(msg));
                return;
            }
            const listeners = self.listeners.get(m.command);
            if(typeof listeners === 'object'){
                for(var i = 0; i < listeners.length; i++){
                    listeners[i].call(m);
                }
            }
        }
        /*
            switch (m.command.toLowerCase()) {
                case "play":
                    Central.getPlayer().getCurrentPlayer().play();
                    break;
                case "pause":
                    Central.getPlayer().getCurrentPlayer().pause();
                    break;
                case "next":
                    Central.getPlayer().nextSong();
                    break;
                // TODO: more
                default:
                    Log.info("Unhandled message command: " + m.command);
                    break;
            }
        }*/

    }

    this.getMessage();

    return this;
}

LocalComm.instance = null;

/**
 * Get the instance
 * @returns {LocalComm}
 */
LocalComm.getInstance = function () {
    if (LocalComm.instance === null) {
        LocalComm.instance = new LocalComm();
    }
    return LocalComm.instance;
}

LocalComm.newMessage = function(message, recipient,success){
    const self = LocalComm.getInstance();
    var msg = new Message({
        msg: JSON.stringify(message),
        recipient: recipient
    });
    if(success == null){
        //success = function(){};
    }else {
        self.messageCallbacks.put(msg.id, success);
    }

    $.post("/msg", {msg: JSON.stringify(msg)});
}

/**
 *
 * @param command
 * @param {Callable} listener
 */
LocalComm.registerListener = function(command, listener){
    const self = LocalComm.getInstance();
    if(! command instanceof Callable){
        Log.error("invalid LocalComm listener for '"+command+"' registered! "+listener)
    }

    var arr = self.listeners.get(command);
    if(arr == null){
        arr = [];
        self.listeners.put(command, arr);
    }
    var i = arr.length;
    arr[i] = listener;
}

LocalComm.unregisterListener = function(listener){
    const self = LocalComm.getInstance();
    for(var i = 0; i < self.listeners.values.length; i++){
        const arr = self.listeners.values[i];
        for(var i2 = 0; i2 < arr.length; i2++){
            if(arr[i2].equal(listener)){
                arr.splice(i2, 1);
            }
        }
    }
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
        this.json = obj.json;
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
    CRAWLER : "CRAWLER",
    CENTRAL : "CENTRAL"
}