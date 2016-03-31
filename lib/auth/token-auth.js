'use strict';

var mongoose = require('mongoose'),
    Promise = require('bluebird');

module.exports = function () {
    return Promise.coroutine(function*(req, res, next) {
        if (req.authorization && req.authorization.scheme === 'bearer' && req.authorization.credentials) {
            var access_token = yield mongoose.model('AccessToken')
                .findOne({token: req.authorization.credentials});
            if (!access_token) {
                return next();
            }
            var api_key = yield mongoose.model('ApiKey').findOne({key: access_token.api_key});
            if (!api_key) {
                return next();
            }
            req.api_key = api_key;
            req.user = yield mongoose.model('User').findOne({uuid: api_key.user_uuid, confirmed: true, blocked: false});
            next();
        } else {
            req.roles = ['guest'];
            next();
        }
    });
};
