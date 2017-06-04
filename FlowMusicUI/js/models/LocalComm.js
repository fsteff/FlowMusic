/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

/**
 * Singleton-Class that can be used for communication with the backend by polling /inmsg
 * @returns {LocalComm}
 * @constructor
 */
function LocalComm(){
    const self = this;
    this.messageCallbacks = new Map();
    this.listeners = new Map();

    /**
     * Is called every time a message is returned by /inmsg.
     * @param data {string} string representation of JSON message
     */
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
                var logmsg = clipString(JSON.stringify(msg.msg), 97);
                Log.info("Message from " + msg.sender + ": " + logmsg);
            } else {
                self.processMessage(msg);
            }
        }
        self.getMessage();
    }

    /**
     * Polls /inmsg for new messages
     */
    this.getMessage = function(){
        $.ajax({
            url: "/inmsg",
            success: self.onMessage,
            error: function( jqXHR, textStatus, errorThrown ){
            /*    if(errorThrown != null)
                    Log.error("GET /inmsg (Message-Polling) failed: " + errorThrown + " " + textStatus);*/
                window.setTimeout(self.getMessage, 5000);
            },
            timeout: 6000
        });
    }

    /**
     * Handles all messages not handeled by a messageCallback handler.
     * If a message contains the "command" parameter it is forwarded to all registered listeners of this command.
     * @param msg
     */
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
            if(listeners !== null && typeof listeners === 'object'){
                for(var i = 0; i < listeners.length; i++){
                    listeners[i].call(m);
                }
            }
        }
    }
    // start message polling later to avoid blocking the UI
    window.setTimeout(this.getMessage, 10);

    return this;
}

LocalComm.instance = null;

/**
 * Get the singleton instance
 * @returns {LocalComm}
 */
LocalComm.getInstance = function () {
    if (LocalComm.instance === null) {
        LocalComm.instance = new LocalComm();
    }
    return LocalComm.instance;
}

/**
 * Sends a message to the message queue of the backend
 * @param message {Object} object that will be converted to JSON
 * @param recipient {String} backend component name
 * @param success {function(object)} callback from the backend component
 */
LocalComm.newMessage = function(message, recipient,success){
    const self = LocalComm.getInstance();
    var msg = new Message({
        msg: JSON.stringify(message),
        recipient: recipient
    });
    if(success == null) {
        success = function (aw) {
            Log.info("LocalComm: message to "+recipient
                +"'" + clipString(JSON.stringify(message), 97) + " was answered: '"
                + clipString(JSON.stringify(aw)) + "'");
        };
    }
    self.messageCallbacks.put(msg.id, success);

    $.post("/msg", {msg: JSON.stringify(msg)});
}

/**
 * Registers a command listener that will be called if certain commands arrive
 * @param command {string}
 * @param listener {Callable}
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

/**
 * Removes a listener
 * @param listener {Callable}
 */
LocalComm.unregisterListener = function(listener){
    const self = LocalComm.getInstance();
    for(var i = 0; i < self.listeners.values.length; i++){
        const arr = self.listeners.values[i];
        for(var i2 = 0; i2 < arr.length; i2++){
            if(arr[i2].equals(listener)){
                arr.splice(i2, 1);
            }
        }
    }
}

// ---------------------------------------------- CLASS Message --------------------------------------------------------


/**
 * Class that represents a message - only for internal use in LocalComm(!)
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
        this.id = Message.idCounter++;
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

Message.idCounter = 1;

/**
 * @enum for backend components as recievers of a message
 * @type {{ANY: string, WEBSERVER: string, DATABASE: string, GUI: string, CRAWLER: string, CENTRAL: string}}
 */
Message.Components = {
    ANY : "ANY",
    WEBSERVER : "WEBSERVER",
    DATABASE : "DATABASE",
    GUI : "GUI",
    CRAWLER : "CRAWLER",
    CENTRAL : "CENTRAL"
}