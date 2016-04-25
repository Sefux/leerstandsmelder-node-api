'use strict';

var restify = require('restify'),
    errorReporter = require('./error-reporter');

module.exports.handleDataResponse = function (data, status, res, next) {
    if (data) {
        res.send(status, data);
        next();
    } else {
        next(new require('restify').NotFoundError());
    }
};

module.exports.handleErrorResponse = function (err, res, next) {
    if (err) {
        if (err.name === 'ValidationError') {
            res.send(new restify.InvalidContentError({
                message: 'errors.validation_failed',
                body: {
                    message: 'errors.validation_failed',
                    errors: err.errors
                }
            }));
        } else if (err.name === 'CastError') {
            return next(new restify.BadRequestError());
        } else {
            if (err.restCode || err.statusCode) {
                return next(err);
            }
            return errorReporter.notify(err)
                .then(function () {
                    console.log('Unresolved API error', err.message, err.stack);
                    return next(new restify.InternalServerError());
                })
                .catch(function (err) {
                    console.log('Failed to notify Airbake.io:', err.message);
                    console.log('Unresolved API error', err.message, err.stack);
                    return next(new restify.InternalServerError());
                });
        }
    }
    next();
};