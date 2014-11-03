
var debug = require('visionmedia/debug')('thing');

module.exports = Thing;

function Thing() {
  debug('thing!')
  this.id = 'hello';
}
