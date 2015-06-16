'use strict';
var passport = require('passport');

module.exports = function(app) {
  var notificationController = require('../controllers/notification_controller');
  app.post('/notification/:id', passport.authenticate('hoist'), notificationController.send);
  app.options('*', function(req, res) {
    res.send("ok");
  });
  app.get('/ping', function(req, res) {
    res.send({
      ok: true,
      node: process.env.NODE_NAME,
      port: process.env.PORT
    });
  });
};
