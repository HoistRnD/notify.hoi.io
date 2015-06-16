'use strict';
var express = require('express'),

	hoist = require('hoist-core'),
	passport = require('passport');

var allowCrossDomain = function(req, res, next) {
	if (req.headers['origin']) {
		res.header('Access-Control-Allow-Origin', req.headers['origin']);
	} else {
		res.header('Access-Control-Allow-Origin', "*");
	}
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	var allowHeaders = 'Content-Type, authorize';
	if (req.headers['access-control-request-headers']) {
		allowHeaders = req.headers['access-control-request-headers'];
	}
	res.header('Access-Control-Allow-Headers', allowHeaders);
	res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age',3000);
	next();
};

module.exports = function(app) {
	app.disable('x-powered-by');
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(hoist.session());
	app.use(passport.initialize({
		userProperty: 'application'
	}));
	app.use(passport.session());
		app.use(allowCrossDomain);

  app.use(hoist.middleware.logging);
	app.use(app.router);

  app.use(hoist.middleware.errorHandler);
};
