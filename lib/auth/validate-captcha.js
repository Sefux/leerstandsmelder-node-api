'use strict';

var mongoose = require('mongoose'),
    responseHandler = require('../util/response-handlers'),
    Promise = require('bluebird');

module.exports = function () {
    return Promise.coroutine(function*(req, res, next) {
        if (req.body && req.body.captcha) {
            var code = parseInt(req.body.captcha);
            if (code && (yield mongoose.model('Captcha').findOneAndRemove({code: code}))) {
                return next();
            }
            responseHandler.handleErrorResponse({
                name: 'ValidationError',
                errors: [{
                    field: 'captcha',
                    message: 'captchas.invalid_code'
                }]
            }, res, next);
        } else {
            next();
        }
    });
};