'use strict';
var q = require('hoist-core').q,
  _ = require('underscore'),
  mu = require('mu2'),
  errors = require('../lib/errors'),
  hoist = require('hoist-core'),
  config = hoist.utils.defaults,
  postmark = require('postmark')(config.postmark.key),
  User = hoist.models.User,
  validator = require('validator');

var NotificationsController = function() {

};
NotificationsController.prototype.send = function(req, res) {
  var environment = req.environment;
  var member = req.session.passport.member;
  hoist.auth.helpers.notifications.canSend(member, environment)
    .then(function(allowed) {
      if (!allowed) {
        throw new errors.request.Forbidden("User is not allowed to send notifications");
      }
      return _.find(req.environment.notificationTemplates, function(template) {
        return template.name === req.params.id;
      });
    }).then(function(notificationTemplate) {
      if (!notificationTemplate) {
        throw new errors.request.NotFound('notification template not found');
      }

      req.logger.info('sending notification template ', req.params.id, notificationTemplate);
      var email = notificationTemplate;
      return q.all([
          NotificationsController.processTemplate('html', notificationTemplate.html, req.body),
          NotificationsController.processTemplate('text', notificationTemplate.text, req.body),
          NotificationsController.processTemplate('subject', notificationTemplate.subject, req.body),
          NotificationsController.processTemplate('to', notificationTemplate.to, req.body),
          NotificationsController.processTemplate('from', notificationTemplate.from, req.body),
          NotificationsController.processTemplate('replyTo', notificationTemplate.replyTo, req.body)
        ])
        .then(function(compiledTemplates) {
          email.html = compiledTemplates[0];
          email.text = compiledTemplates[1];
          email.subject = compiledTemplates[2];
          email.from = compiledTemplates[4];
          email.replyTo = compiledTemplates[5];
          if (!validator.isEmail(email.replyTo)) {
            throw new errors.request.BadRequest("replyTo must be email address");
          }
          //No templating of the to has occured
          if (email.to === compiledTemplates[3]) {
            return email;
          } else {
            email.to = compiledTemplates[3];
            return User.findOneQ({
              'emailAddresses.address': email.to
            }).then(
              function(user) {
                if (!user) {

                  throw new errors.general.ValidationError("no users exist with that email address in the application");
                } else {
                  //Only send to members of the current enviroment
                  if (_.find(req.environment.members, function(mem) {
                    return mem.userId.equals(user._id);
                  })) {
                    return email;
                  } else {
                    throw new errors.general.ValidationError("no users exist with that email address in the application");
                  }
                }
              });
          }
        });
    }).then(function(email) {
      console.log('sending email');
      return NotificationsController.sendEmail(email);
    }).then(function() {
      res.send({
        status: "ok"
      });
    }).fail(function(err) {
      if (!err.resCode) {
        hoist.error(err, req, req.application);
        err = new errors.server.ServerError();
      }
      res.send(err.resCode || 500, err.message);
    }).done();
};
NotificationsController.processTemplate = function(name, templateString, data) {
  var renderedText = "";

  return q.nfcall(mu.compileText, name, templateString).then(function(compiledTemplate) {

    var templateDone = q.defer();
    var stream = mu.render(compiledTemplate, data).on('data', function(buffer) {
      renderedText += buffer.toString();
    }).on('end', function() {
      templateDone.resolve(renderedText);
    });
    stream.resume();
    return templateDone.promise;
  });
};
NotificationsController.sendEmail = function(email) {
  return q.nfcall(postmark.send, {
    From: email.from + ' <hoist@notifications.hoi.io>',
    To: email.to,
    Subject: email.subject,
    TextBody: email.text,
    HtmlBody: email.html,
    ReplyTo: email.replyTo
  });
};
module.exports = new NotificationsController();
