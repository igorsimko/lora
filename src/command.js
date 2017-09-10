var apiai = require('apiai');
var crypto = require('crypto');
var app = require('express');
var request = require('request');
var fs = require('fs');
var xml2js = require('xml2js');
var sys = require('util');
var exec = require('child_process').exec;

var dateFormat = require('dateformat');

var basePath = "";

var LOG = undefined;

var sha = crypto.createHash('sha256');
var sessionId = sha.update(Math.random().toString()).digest('hex');

// var app_ai = apiai("fe22179c6de74a429bc43857a69e2dfa");
var app_ai = apiai("3e3960927dd44827b315f46e97a16b1e");

var home_ai = parseHomeAiXML();
var parser = new xml2js.Parser();

var LORA = false;

var options = {
    sessionId: sessionId
}

module.exports = {
  setLogger: function(logger){
    LOG = logger;
  },
  callFunctionByName: function (response) {
    if (response == undefined) {
        LOG.error("Response is undefined!");
        return;
    }
    var callFunction = getRealFunctionCall(response);
    if (callFunction == undefined) {
        return;
    }
    LOG.info("Calling function by name = "+ JSON.stringify(callFunction.name));

    if (callFunction.options) {
         global[callFunction.name](callFunction.options);
    } else {
        global[callFunction.name]();
    }
  },
  setLora: function(loraBoolean){
        if (loraBoolean != undefined) {
            LORA = loraBoolean;
        }
  },
  isLora: function(){
    return LORA;
  },
  tell: function(text){
    exec("./shell/speak.sh \"" + text + "\"", function(err, stdout, stderr){
        getPath();
        if (stderr) {
            LOG.error(stderr);
        } else if (err) {
            LOG.error(err);
        }
    });
  }
};

function getPath(){
    exec("pwd", function(err, stdout, stderr){
        basePath = stdout;
        if (stderr) {
            LOG.error(stderr);
            basePath = "";
        } else if (err) {
            LOG.error(err);
            basePath = "";
        }
        LOG.error("|" + basePath + "|");
    });
}

function parseHomeAiXML(){
    fs.readFile(__dirname + '/home-ai.xml', function(err, data) {
        parser.parseString(data, function (err, result) {
            if(result != undefined){
                home_ai = result['home-ai'];
            }
        });
    });
}

function getRealFunctionCall(response){
    LOG.info("Getting function name ...");
    var params = response.result.parameters;
    var rThing = params['thing'];
    var rAction = params['action'];
    var rLocation = params['location'];

    var things = home_ai['things'];

    if (response.result.action != "thing.info") {
        LOG.info("Response action is not thing.info");
        var firstFunctionTry = getPrebuildAgentAction(response);
        return firstFunctionTry;
    }

    // deprecated - use for custom things-intent
    if (things[0][rThing] != undefined) {
        for (var i = 0; i < things[0][rThing].length; i++) {
            var thing = things[0][rThing][i];
            if (thing['action'] == rAction && (thing['location'] == rLocation || (rLocation == "") && thing['location'] == undefined) ) {
                    LOG.info("match ("+ thing['function'] +") :" + thing['action'] + ", " + thing['location']);
                    return {
                        name: thing['function']
                    };
            }
        }
    }
    LOG.info("No function was found!");
}

function getPrebuildAgentAction(response){
    var intentName = response.result.metadata.intentName;
    var rParameters = response.result.parameters;

    if (intentName == undefined || intentName == "") {
        return;
    }

    var intents = home_ai['agents'];

    for (var i = 0; i < intents[0]["intent"].length; i++) {
        var intent = intents[0]["intent"][i];
        var uids = intent["uids"][0];

        for(var j = 0; j < intent["uids"][0]["uid"].length ; j ++){
            var uid = intent["uids"][0]["uid"][j];
            if ((uid != undefined || uid != "") && uid == intentName) {
                var func = intent["function"][0];

                if (func["parameters"]) {
                    var params = func["parameters"][0]["param"];
                    var resultOptions = {};

                    for (var k = 0; k < params.length ; k++) {
                        var p = params[k]["$"];
                        var paramName = p["value"];
                        var paramValue = rParameters[p["name"]];

                        resultOptions[paramName] = paramValue;
                    }
                }
                 LOG.debug(JSON.stringify(resultOptions));
                return {
                    name: intent["function"][0]["name"][0],
                    options: resultOptions
                };
            }
        }
    }
}

/* WEATHER */
global.getTemperatureOutsideInfo = function getTemperatureOutsideInfo(){
    request.post(
        'http://api.openweathermap.org/data/2.5/weather?q=Bratislava&APPID=25d58ec4b67cf6971203cf044ceda2ec&units=metric',
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var tempText = "Outside temperature is " + JSON.parse(body).main.temp + " degrees";
                module.exports.tell(tempText);
            }
        }
    );
}

global.getTemperatureInsideInfo = function getTemperatureInsideInfo(){
    console.log("Inside weather.");
}

/* MUSIC */
global.volumeUp = function volumeUp(){
    console.log("volume up!");
}
global.volumeDown = function volumeDown(){
    console.log("volume down!");
}
global.playMusic = function playMusic(){
    exec("./shell/music/mpc-cmd.sh 'play'");
}
global.stopMusic = function stopMusic(){
    exec("./shell/music/mpc-cmd.sh 'stop'");
}
global.setVolume = function setVolume(options){
    if (options) {
        console.log("./shell/music/mpc-cmd.sh 'volume "+ options.finalValue +"'");
        exec("./shell/music/mpc-cmd.sh 'volume "+ options.finalValue +"'");
    }

}

/* DATE */
global.getDate = function getDate(){
    var tempText = "Today is " + dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss");
    module.exports.tell(tempText);
}



