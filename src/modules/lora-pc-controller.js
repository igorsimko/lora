var wol = require('node-wol');
var LOG = require('../config/logger.js').getLogger();

var PC_MAC_ADDRESS = "28:D2:44:24:D5:DE";

wol.wake(PC_MAC_ADDRESS);

wol.wake(PC_MAC_ADDRESS, function(error) {
  if(error) {
    LOG.error('WOL packet was not send.');
    return;
  }
  LOG.info('WOL packet was send.');
});

var magicPacket = wol.createMagicPacket(PC_MAC_ADDRESS);
