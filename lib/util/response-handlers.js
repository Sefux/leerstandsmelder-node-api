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
                message: 'Validation failed',
                body: {
                    message: 'Validation failed',
                    errors: err.errors
                }
            }));
        } else if (err.name === 'CastError') {
            return next(new restify.BadRequestError());
        } else {
            console.log('Unresolved MongoDB error', err);
            return next(new restify.InternalServerError());
        }
    }
    next();
};