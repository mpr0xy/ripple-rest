var _     = require('lodash');
var fs    = require('fs');
var nconf = require('nconf');


/** Load Configuration according to the following hierarchy 
 *  (where items higher on the list take precedence)
 *
 *  1. Command line arguments
 *  2. Environment variables
 *  3. The config.json file (if it exists) in the root directory
 *  4. The defaults defined below
 */


nconf
  .argv()
  .env();

// Get rippled from command line args, if supplied
if (nconf.get('rippled')) {
  var match = nconf.get('rippled').match(/^(wss|ws):\/\/(.+):([0-9]+)$/);
  if (match) {
    nconf.overrides({
      rippled_servers: [{
        host: match[2],
        port: match[3],
        secure: (match[1] === 'wss')
      }]
    });
  }
}

// If config.json exists, load from that
try {
  var config_url = nconf.get('config') || './config.json';
  fs.readFileSync(config_url);
  nconf.file(config_url);
} catch (err) {}

nconf.defaults({
  PORT: 5990,
  NODE_ENV: 'development',
  HOST: 'localhost',
  rippled_servers: [
    {
      host: 's-west.ripple.com',
      port: 443,
      secure: true
    }
  ],
  currency_prioritization: [
    'XRP',
    'EUR',
    'GBP',
    'AUD',
    'NZD',
    'USD',
    'CAD',
    'CHF',
    'MXN',
    'SGD', 
    'NOK', 
    'JPY',
    'CNY'
  ],
  currency_pair_exceptions: [
    'ZAR/JPY'
  ]
});

// Make sure currency codes are uppercase
function uppercaseArray(array) {
  return _.map(array, function(val){
    return val.toUpperCase();
  });
}
nconf.set('currency_prioritization', uppercaseArray(nconf.get('currency_prioritization')));
nconf.set('currency_pair_exceptions', uppercaseArray(nconf.get('currency_pair_exceptions')));

module.exports = nconf;