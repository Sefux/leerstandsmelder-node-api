'use strict';

var mongoose = require('mongoose'),
    restifyErrors = require('restify-errors'),
    Promise = require('bluebird'),
    rHandler = require('../lib/util/response-handlers');

module.exports.post = function (req, res, next) {
    return Promise.coroutine(function* () {
        var cred = {};

        // API key and secret

        if (req.body.key && req.body.secret) {
            cred.api_key = yield mongoose.model('ApiKey').findOne({
                key: req.body.key,
                secret: req.body.secret
            });
        }

        // Email & password

        if (req.body.email) {
            let user = yield mongoose.model('User').findOne({email: req.body.email, confirmed: true, blocked: false});
            if (user) {
                let valid = yield user.isValidPassword(req.body.password);
                cred.user = valid ? user : null;
            }
        }

        // Single access token

        if (req.body.single_access_token) {
            cred.user = yield mongoose.model('User').findOne({
                single_access_token: req.body.single_access_token,
                blocked: false
            });
            if (cred.user && !cred.user.confirmed) {
                yield cred.user.confirmUser();
            }
        }

        // We have a user but no key yet

        if (!cred.api_key && cred.user) {
            let key = yield mongoose.model('ApiKey').findOne({user_uuid: cred.user.uuid});
            cred.api_key = key ? key : yield mongoose.model('ApiKey').create({user_uuid: cred.user.uuid, scopes: cred.user.scopes});
        }

        // Send error and abort if key is inactive, no key is found or could not be created (no user)

        if (!cred.api_key || !cred.api_key.active) {
            rHandler.handleErrorResponse(new restifyErrors.InvalidCredentialsError(), res, next);
            return;
        }

        // Get the access token(s) for the current key and grab the most recent

        cred.access_token = yield mongoose.model('ApiKey').findOne({api_key: cred.api_key.key})
            .sort('-issued').exec();

        // Respond with new or current access token (create if invalid)

        if (cred.access_token && cred.access_token.isValid()) {
            rHandler.handleDataResponse(cred.access_token, 200, res, next);
        } else {
            let access_token = yield mongoose.model('AccessToken').create({
                api_key: cred.api_key.key
            });
            rHandler.handleDataResponse(access_token, 201, res, next);
        }
    })().catch(function (err) {
        console.log('Unresolved auth error', err.message, err.stack);
        rHandler.handleErrorResponse(new restifyErrors.InvalidCredentialsError(), res, next);
    });
};
