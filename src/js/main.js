/*
 * This is the main PebbleJS file. You do not need to modify this file unless
 * you want to change the way PebbleJS starts, the script it runs or the libraries
 * it loads.
 *
 * By default, this will run app.js
 */

var util2 = require('./lib/util2');
require('./ui/simply-pebble.js').init();

Pebble.addEventListener('ready', function(e) {
});
