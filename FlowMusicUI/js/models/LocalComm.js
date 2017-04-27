/**
 * @author Fixl Stefan
 * Copyright 2017 Fixl Stefan
 */

function LocalComm(){
    const self = this;
    this.messageCallbacks = [];

    this.onMessage = function(data){
        var msg = new Message({json: data});
        var answerTo = msg.answerTo;
        if((typeof answerTo !== 'undefined')
            &&	answerTo !== null && answerTo > 0
            && 	(typeof self.messageCallbacks[answerTo] !== 'undefined')
            && 	self.messageCallbacks[answerTo] !== null){
            self.messageCallbacks[answerTo](msg.msg);
            delete self.messageCallbacks[answerTo];
            Log.info("Message from "+msg.sender+": "+JSON.stringify(msg.msg));
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
    self.messageCallbacks[msg.id] = success;

    $.post("/msg", {msg: JSON.stringify(msg)});
}