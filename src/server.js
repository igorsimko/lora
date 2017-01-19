var http = require('http');
var express = require('express');
var apiai = require('apiai');
var crypto = require('crypto');
var bodyParser = require('body-parser');
var app = express();

console.log("Initializing server...");

var sha = crypto.createHash('sha256');
var sessionId = sha.update(Math.random().toString()).digest('hex');
console.log("SessionID=["+sessionId+"]");

var app_ai = apiai("fe22179c6de74a429bc43857a69e2dfa");

var options = {
    sessionId: sessionId
}


app.use(express['static'](__dirname ));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/cmd', function(req, res){
    console.log('POST\tcmd');
    console.log(req.body);

    var request = app_ai.textRequest('What temperature is?', options);

    request.on('response', function(response) {
        console.log(response);
    });

    request.on('error', function(error) {
        console.log(error);
    });
    request.end();

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end();
});

// Express route for any other unrecognised incoming requests
app.get('*', function(req, res) {
  res.status(404).send('Unrecognised API call');
});

// Express route to handle errors
app.use(function(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send('Oops, Something went wrong!');
  } else {
    next(err);
  }
});

app.listen(3000);
console.log('App Server running at port 3000');
