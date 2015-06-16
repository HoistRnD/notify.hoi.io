'use strict';
var Security = function() {

};

Security.prototype.generateRandomString = function(length) {
  var result = '';
  for (var i = length; i > 0; --i) {
    result += String.fromCharCode(Math.round(26 * Math.random() + 65));
  }
  return result;
};

Security.prototype.generateShortCode = function() {
  return this.generateRandomString(20);
};
Security.prototype.generateCouchDBCode = function() {
  var mask = '';
  mask += 'abcdefghijklmnopqrstuvwxyz';
  var result = '';
  for (var i = 30; i > 0; --i) {
    result += mask[Math.round(Math.random() * (mask.length - 1))];
  }
  return result;
};

module.exports = new Security();
