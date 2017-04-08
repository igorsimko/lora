var http = require('http');
var express = require('express');
var apiai = require('apiai');
var crypto = require('crypto');
var bodyParser = require('body-parser');
var app = express();
var command = require('./command.js');
var sys = require('sys')
var exec = require('child_process').exec;

var LOG = require('./config/logger.js').getLogger();

var DEFAULT_API_URL = "/api"

LOG.info("Initializing server...");

var sha = crypto.createHash('sha256');
var sessionId = sha.update(Math.random().toString()).digest('hex').substring(0,20);
LOG.info("SessionID = ["+sessionId+"]");

var app_ai = apiai("fe22179c6de74a429bc43857a69e2dfa");

var options = {
    sessionId: sessionId
}

app.use(require('express-promise')());
app.use(express['static'](__dirname ));
app.use(bodyParser.json());


app.post(DEFAULT_API_URL + '/upload',function(req,res){
    var statusMsg = "";
    var voiceRequest = app_ai.voiceRequest();

    chunks=[];
    req.on('data',function(chunk){
        chunks.push(chunk);

    });

    req.on('end',function(){
        var data = Buffer.concat(chunks);
        fs.writeFile(path,data,'binary',function(err){
            if(err){
                statusMsg = 'couldnt make file' + err;
                LOG.debug(statusMsg);
            } else {
                statusMsg = "Audio received successfully.";
                LOG.debug(statusMsg);
                voiceRequest.write(data);
            }
        });
    });

    voiceRequest.on('response', function(response) {
        LOG.debug(response);
    });

    voiceRequest.on('error', function(error) {
        LOG.debug(error);
    });

    res.status(200).send(statusMsg);
 });

app.post(DEFAULT_API_URL + '/cmd', function(req, res){
    LOG.info('POST\t/cmd');
    var text;
    if (req.body != undefined) {
        text = req.body.text;
        //console.log('BODY\ttext: '+ req.body.text);
    } else if(text != undefined){
        LOG.error('ERROR\t body.text is undefined');
        errorResponse(res, "Body.text is undefined");
    }

    var request = app_ai.textRequest(text, options);

    var responseMessage;
    request.on('response', function(response) {
        if (response.status.code == 200) {
            if (response.result != undefined || response.result.size() > 0) {
                var action = response.result.action;
                LOG.debug(response.result.parameters);
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
                exec("espeak -ven+f3 -s7'"+ response.result.fulfillment.speech +"' 2>/dev/null", puts);
            }
        }
    });

    request.on('error', function(error) {
        LOG.error(error);
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

function puts(error, stdout, stderr) { sys.puts(stdout) }

function errorResponse(res, msg){
    if (msg != undefined) {
      res.status(500).send(msg);
    } else {
      res.status(500).send('Oops, Something went wrong!');
    }
    res.end();
}

app.listen(3000);
LOG.info('App Server running at port 3000');
