'use strict';
var request = require('supertest'),
  q = require('hoist-core').q,
  app = require('../../app'),
  http = require('http'),
  nock = require('nock'),
  hoist = require('hoist-core'),
  Application = hoist.models.Application,
  Organisation = hoist.models.Organisation;


describe('notification controller', function() {
  var _postmarkRequest;
  describe('POST #notification to existing notification with invalid api_key', function() {
    var _responseReceived;

    before(function() {
      _postmarkRequest = nock('http://api.postmarkapp.com')
        .post('/email', {
          "From": "owen@hoistapps.com <hoist@notifications.hoi.io>",
          "To": "test@hoi.io",
          "Subject": "hello owen",
          "TextBody": "email text\nMy name is owen",
          "HtmlBody": "<html><body>this is some text <br/> My name is owen</body></html>",
          "ReplyTo": "owen@hoistapps.com"
        })
        .reply(200, {
          "To": "owen@hoistapps.com",
          "SubmittedAt": "2013-11-21T04:32:16.6240301-05:00",
          "MessageID": "3accc7c4-bcf2-4092-9936-2096ce79f0d6",
          "ErrorCode": 0,
          "Message": "Test job accepted"
        });

      _responseReceived = new Organisation().saveQ()
        .then(function(org) {
          var roleCollection = hoist.models.RoleCollection.createNew();
          roleCollection.anonClaims.push('send-notification');
          return roleCollection.saveQ().then(function(roleCollection) {
            return new Application({
              ownerOrganisation: org._id,
              environments: [{
                availableRoles: roleCollection,
                name: '_default',
                isDefault: true,
                notificationTemplates: [{
                  name: "my_notification",
                  text: "email text\nMy name is {{name}}",
                  html: "<html><body>this is some text <br/> My name is {{name}}</body></html>",
                  to: "test@hoi.io",
                  from: "owen@hoistapps.com",
                  subject: "hello {{name}}"
                }]
              }]
            }).saveQ();
          });

        }).then(function() {
          var r = request(http.createServer(app))
            .post('/notification/my_notification')
            .set("Authorization", "Hoist invalid")
            .send({
              name: 'owen'
            });
          return q.ninvoke(r, 'end');
        });


    });
    it('should return a 401 response', function() {
      return _responseReceived.then(function(response) {
        response.statusCode.should.equal(401);
      });
    });
    it('should not send an email request', function() {
      return _responseReceived.then(function() {
        _postmarkRequest.isDone().should.equal(false);
      });
    });
    after(function(done) {
      nock.cleanAll();
      Application.remove({}, function() {
        Organisation.remove({}, done);
      });
    });
  });
  describe('POST #notification to notification template that doesn\'t exist', function() {
    var _responseReceived;
    before(function() {
      _postmarkRequest = nock('http://api.postmarkapp.com')
        .post('/email', {
          "From": "owen@hoistapps.com <hoist@notifications.hoi.io>",
          "To": "test@hoi.io",
          "Subject": "hello owen",
          "TextBody": "email text\nMy name is owen",
          "HtmlBody": "<html><body>this is some text <br/> My name is owen</body></html>",
          "ReplyTo": "owen@hoistapps.com"
        })
        .reply(200, {
          "To": "owen@hoistapps.com",
          "SubmittedAt": "2013-11-21T04:32:16.6240301-05:00",
          "MessageID": "3accc7c4-bcf2-4092-9936-2096ce79f0d6",
          "ErrorCode": 0,
          "Message": "Test job accepted"
        });
      _responseReceived = new Organisation().saveQ()
        .then(function(org) {
          var roleCollection = hoist.models.RoleCollection.createNew();
          roleCollection.anonClaims.push('send-notification');
          return roleCollection.saveQ().then(function(roleCollection) {
            return new Application({
              ownerOrganisation: org._id,
              environments: [{
                name: '_default',
                availableRoles: roleCollection,
                isDefault: true,
                notificationTemplates: [{
                  name: "my_other_notification",
                  text: "email text\nMy name is {{name}}",
                  html: "<html><body>this is some other text <br/> My name is {{name}}</body></html>",
                  to: "test@hoi.io",
                  from: "owen@hoistapps.com",
                  subject: "bye {{name}}"
                }, {
                  name: "my_notification",
                  text: "email text\nMy name is {{name}}",
                  html: "<html><body>this is some text <br/> My name is {{name}}</body></html>",
                  to: "test@hoi.io",
                  from: "owen@hoistapps.com",
                  subject: "hello {{name}}"
                }]
              }]
            }).saveQ();
          });
        }).then(function(application) {
          var r = request(http.createServer(app))
            .post('/notification/another_notification')
            .set("Authorization", "Hoist " + application.apiKey)
            .send({
              name: 'owen'
            });
          return q.ninvoke(r, 'end');
        });


    });
    it('should return a 404 response', function() {
      return _responseReceived.then(function(response) {
        response.statusCode.should.equal(404);
      });
    });
    it('should not send an email request', function() {
      return _responseReceived.then(function() {
        _postmarkRequest.isDone().should.equal(false);
      });
    });
    after(function(done) {
      nock.cleanAll();
      Application.remove({}, done);
    });
  });
  describe('POST #notification to existing notification', function() {
    var _responseReceived;
    before(function(done) {
      _postmarkRequest = nock('http://api.postmarkapp.com')
        .post('/email', {
          "From": "owen@hoistapps.com <hoist@notifications.hoi.io>",
          "To": "test@hoi.io",
          "Subject": "hello owen",
          "TextBody": "email text\nMy name is owen",
          "HtmlBody": "<html><body>this is some text <br/> My name is owen</body></html>",
          "ReplyTo": "owen@hoistapps.com"
        })
        .reply(200, {
          "To": "owen@hoistapps.com",
          "SubmittedAt": "2013-11-21T04:32:16.6240301-05:00",
          "MessageID": "3accc7c4-bcf2-4092-9936-2096ce79f0d6",
          "ErrorCode": 0,
          "Message": "Test job accepted"
        });
      _responseReceived = new Organisation().saveQ()
        .then(function(org) {
          var roleCollection = hoist.models.RoleCollection.createNew();
          roleCollection.anonClaims.push('send-notification');
          return roleCollection.saveQ().then(function(roleCollection) {
            return new Application({
              ownerOrganisation: org._id,
              environments: [{
                name: '_default',
                isDefault: true,
                availableRoles: roleCollection,
                notificationTemplates: [{
                  name: "my_other_notification",
                  text: "email text\nMy name is {{name}}",
                  html: "<html><body>this is some other text <br/> My name is {{name}}</body></html>",
                  to: "test@hoi.io",
                  from: "owen@hoistapps.com",
                  subject: "bye {{name}}",
                  replyTo: "owen@hoistapps.com"
                }, {
                  name: "my_notification",
                  text: "email text\nMy name is {{name}}",
                  html: "<html><body>this is some text <br/> My name is {{name}}</body></html>",
                  to: "test@hoi.io",
                  from: "owen@hoistapps.com",
                  subject: "hello {{name}}",
                  replyTo: "owen@hoistapps.com"
                }]
              }]
            }).saveQ();
          });
        }).then(function(application) {
          var r = request(http.createServer(app))
            .post('/notification/my_notification')
            .set("Authorization", "Hoist " + application.apiKey)
            .send({
              name: 'owen'
            });
          return q.ninvoke(r, 'end');
        });
      done();

    });
    it('should return a 200 response', function() {
      return _responseReceived.then(function(response) {
        response.statusCode.should.equal(200);
      });
    });
    it('should send an email request', function() {
      return _responseReceived.then(function() {

        _postmarkRequest.isDone().should.equal(true);
      });
    });
    after(function(done) {
      nock.cleanAll();
      Application.remove({}, done);
    });
  });
  describe('POST #notification to existing notification if user doesn\'t have permission to send notification', function() {
    var _responseReceived;
    before(function() {
      _postmarkRequest = nock('http://api.postmarkapp.com')
        .post('/email', {
          "From": "owen@hoistapps.com <hoist@notifications.hoi.io>",
          "To": "test@hoi.io",
          "Subject": "hello owen",
          "TextBody": "email text\nMy name is owen",
          "HtmlBody": "<html><body>this is some text <br/> My name is owen</body></html>",
          "ReplyTo": "owen@hoistapps.com"
        })
        .reply(200, {
          "To": "owen@hoistapps.com",
          "SubmittedAt": "2013-11-21T04:32:16.6240301-05:00",
          "MessageID": "3accc7c4-bcf2-4092-9936-2096ce79f0d6",
          "ErrorCode": 0,
          "Message": "Test job accepted"
        });
      _responseReceived = new Organisation().saveQ()
        .then(function(org) {
          var roleCollection = hoist.models.RoleCollection.createNew();
          return roleCollection.saveQ().then(function(roleCollection) {
            return new Application({
              ownerOrganisation: org._id,
              environments: [{
                name: '_default',
                isDefault: true,
                availableRoles: roleCollection,
                notificationTemplates: [{
                  name: "my_other_notification",
                  text: "email text\nMy name is {{name}}",
                  html: "<html><body>this is some other text <br/> My name is {{name}}</body></html>",
                  to: "test@hoi.io",
                  from: "owen@hoistapps.com",
                  subject: "bye {{name}}",
                  replyTo: "owen@hoistapps.com"
                }, {
                  name: "my_notification",
                  text: "email text\nMy name is {{name}}",
                  html: "<html><body>this is some text <br/> My name is {{name}}</body></html>",
                  to: "test@hoi.io",
                  from: "owen@hoistapps.com",
                  subject: "hello {{name}}",
                  replyTo: "owen@hoistapps.com"
                }]
              }]
            }).saveQ();
          });
        }).then(function(application) {
          var r = request(http.createServer(app))
            .post('/notification/my_notification')
            .set("Authorization", "Hoist " + application.apiKey)
            .send({
              name: 'owen'
            });
          return q.ninvoke(r, 'end');
        });


    });
    it('should return a 403 response', function() {
      return _responseReceived.then(function(response) {
        response.statusCode.should.equal(403);
      });
    });
    it('should send an email request', function() {
      return _responseReceived.then(function() {
        _postmarkRequest.isDone().should.equal(false);
      });
    });
    after(function(done) {
      nock.cleanAll();
      Application.remove({}, done);
    });
  });
});
