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
            console.log(thing);
            if (thing['action'] == rAction && (thing['location'] == rLocation || rLocation == "") ) {
                    console.log("match ("+ thing['function'] +") :" + thing['action'] + ", " + thing['location']);
            }
        }
    }
}

// get methods
global.getTemperatureInfo = function getTemperatureInfo(){
    request.post(
        'http://api.openweathermap.org/data/2.5/weather?q=Bratislava&APPID=25d58ec4b67cf6971203cf044ceda2ec&units=metric',
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(JSON.parse(body).main.temp);
            }
        }
    );
}

// set methods
