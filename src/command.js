var apiai = require('apiai');
var crypto = require('crypto');
var app = require('express');
var request = require('request');
var fs = require('fs');
var xml2js = require('xml2js');



var sha = crypto.createHash('sha256');
var sessionId = sha.update(Math.random().toString()).digest('hex');

var app_ai = apiai("fe22179c6de74a429bc43857a69e2dfa");
var home_ai = parseHomeAiXML();
var parser = new xml2js.Parser();

var LORA = false;


var options = {
    sessionId: sessionId
}

module.exports = {
  callFunctionByName: function (response) {
    if (response == undefined) {
        console.log("Response is undefined!");
        return;
    }
    var callFunction = getRealFunctionCall(response);
    if (callFunction == undefined) {
        return;
    }
    console.log("Calling function by name ["+ callFunction +"]");
    global[callFunction]();
  },
  setLora: function(loraBoolean){
        if (loraBoolean != undefined) {
            LORA = loraBoolean;
        }
  },
  isLora: function(){
    return LORA;
  }
};

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
    console.log("Getting function name ...");
    var params = response.result.parameters;
    var rThing = params['thing'];
    var rAction = params['action'];
    var rLocation = params['location'];

    var things = home_ai['thing'];

    if (things[0][rThing] != undefined) {
        for (var i = 0; i < things[0][rThing].length; i++) {
            var thing = things[0][rThing][i];
            if (thing['action'] == rAction && (thing['location'] == rLocation || (rLocation == "") && thing['location'] == undefined) ) {
                    console.log("match ("+ thing['function'] +") :" + thing['action'] + ", " + thing['location']);
                    return thing['function'];
            }
        }
    }
}

function tell(text){
    exec("./shell/speak.sh '" + text + "'");
}

// global functions
global.getTemperatureOutsideInfo = function getTemperatureOutsideInfo(){
    request.post(
        'http://api.openweathermap.org/data/2.5/weather?q=Bratislava&APPID=25d58ec4b67cf6971203cf044ceda2ec&units=metric',
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                JSON.parse(body).main.temp
                console.log(JSON.parse(body).main.temp);
            }
        }
    );
}
// get methods
global.getTemperatureInsideInfo = function getTemperatureInsideInfo(){
  console.log("Inside weather.");
}

global.getSystemTime = function getSystemTime(){
    console.log(new Date());
}

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



