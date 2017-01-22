var http = require('http');
var express = require('express');
var apiai = require('apiai');
var crypto = require('crypto');
var bodyParser = require('body-parser');
var app = express();
var command = require('./command.js');

console.log("Initializing server...");

var sha = crypto.createHash('sha256');
var sessionId = sha.update(Math.random().toString()).digest('hex').substring(0,20);
console.log("SessionID=["+sessionId+"]");

var app_ai = apiai("fe22179c6de74a429bc43857a69e2dfa");

var options = {
    sessionId: sessionId
}

app.use(require('express-promise')());
app.use(express['static'](__dirname ));
app.use(bodyParser.urlencoded({
    extended: true
    })
);

app.post('/cmd', function(req, res){
    console.log('POST\t/cmd');
    var text;
    if (req.body != undefined) {
        text = req.body.text;
        //console.log('BODY\ttext: '+ req.body.text);
    } else if(text != undefined){
        console.log('ERROR\t body.text is undefined');
        errorResponse(res, "Body.text is undefined");
    }

    var request = app_ai.textRequest(text, options);

    var responseMessage;
    request.on('response', function(response) {
        if (response.status.code == 200) {
            if (response.result != undefined || response.result.size() > 0) {
                var action = response.result.action;
                console.log(response.result.parameters);
                if (response.result.action == 'input.welcome') {
                    command.setLora(true);
                } else if (response.result.action == 'shutdown'){
                    command.setLora(false);
                } else if (command.isLora()){
                    command.callFunctionByName(response);
                }
                responseMessage = response.result.fulfillment.speech;
                responseMessage += "  --- lora: " + command.isLora();
                res.json(responseMessage);
            }
        }
    });

    request.on('error', function(error) {
        console.log(error);
    });
    request.end();

});

// Express route for any other unrecognised incoming requests
app.get('*', function(req, res) {
  res.status(404).send('Unrecognised API call');
});

// Express route to handle errors
app.use(function(err, req, res, next) {
  if (req.xhr) {
    errorResponse(res);
  } else {
    next(err);
  }
});

function errorResponse(res, msg){
    if (msg != undefined) {
      res.status(500).send(msg);
    } else {
      res.status(500).send('Oops, Something went wrong!');
    }
    res.end();
}

app.listen(3000);
console.log('App Server running at port 3000');
