'use strict';

var restify = require('restify'),
    routes = require('../routes'),
    Promise = require('bluebird'),
    acl = require('./acl-manager');

module.exports = Promise.coroutine(function *(req, res, next) {
    var currentRoute;
    if (typeof routes.paths[req.route.path] === 'object') {
        if (typeof routes.paths[req.route.path][req.route.method.toLowerCase()] === 'object') {
            currentRoute = routes.paths[req.route.path][req.route.method.toLowerCase()];
        }
    }
    if (req.route.path.indexOf('/api-docs') === 0) {
        return next();
    }
    if (!currentRoute) {
        return next(new restify.InternalError());
    }
    if (currentRoute.scope === 'public') {
        return next();
    }
    if (req.user && req.user.confirmed) {
        if (req.user.blocked) {
            return next(new restify.NotAuthorizedError());
        }
        if (currentRoute.scope === 'user') {
            return next();
        }
        var scopes = req.api_key ? req.api_key.scopes : [];
        if (scopes.indexOf(currentRoute.scope) != -1 || scopes.indexOf('admin') != -1) {
            return next();
        }
        if (yield acl.isAllowed(req.url, scopes.concat([req.user.uuid]), req.method)) {
            return next();
        }
    }
    next(new restify.NotAuthorizedError());
});