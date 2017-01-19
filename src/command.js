var apiai = require('apiai');
var crypto = require('crypto');
var app = require('express');
var request = require('request');
var fs = require('fs');

var sha = crypto.createHash('sha256');
var sessionId = sha.update(Math.random().toString()).digest('hex');

var app_ai = apiai("fe22179c6de74a429bc43857a69e2dfa");
var actions = JSON.parse(fs.readFileSync('src/actions.json', 'utf8'));

var options = {
    sessionId: sessionId
}

module.exports = {
  callFunctionByName: function (input) {
    var functionName = input.toString().trim()
    if (functionName == undefined) {
        return;
    }
    var callFunction = getRealFunctionCall(functionName);
    console.log("Calling function by name ["+ functionName +"]");
    global[callFunction]();
  }
};

function getRealFunctionCall(key){

        console.log(key);

    console.log("ac:" +actions.thing[key]);
    console.log(actions);
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
