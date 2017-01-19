var apiai = require('apiai');
var crypto = require('crypto');
var app = require('express');
var request = require('request');

var sha = crypto.createHash('sha256');
var sessionId = sha.update(Math.random().toString()).digest('hex');

console.log("SessionID=["+sessionId+"]");

var app_ai = apiai("fe22179c6de74a429bc43857a69e2dfa");

var options = {
    sessionId: sessionId
}

function callFunctionByName(name){
    name();
}

// get methods
function getTemperatureInfo(){
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
