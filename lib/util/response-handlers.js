'use strict';

var restify = require('restify');

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
            console.log('Unresolved API error', err.message);
            return next(new restify.InternalServerError());
        }
    }
    next();
};