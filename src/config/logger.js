var Logger = require('basic-logger');
// configure level one time, it will be set to every instance of the logger
Logger.setLevel('debug');

var customConfig = {
    showMillis: true,
    showTimestamp: true
};

var log = new Logger(customConfig);

module.exports = {
    getLogger: function (){
        log.debug('Get logger.');
        return log;
    }
};
