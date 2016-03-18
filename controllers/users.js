'use strict';

var mongoose = require('mongoose'),
    restify = require('restify'),
    Promise = require('bluebird'),
    rHandler = require('../lib/util/response-handlers'),
    acl = require('../lib/auth/acl-manager'),
    CommonController = require('./common');

class UsersController extends CommonController {
    constructor() {
        super();

        this.coroutines.getResource.main = Promise.coroutine(function* (req, res, next, config) {
            var selectAttributes = 'uuid nickname';

            if (req.user && req.user.uuid === req.params.uuid) {
                selectAttributes = 'uuid login email';
            }

            var q = mongoose.model(config.resource)
                .findOne({uuid: req.params.uuid})
                .select(selectAttributes);
            rHandler.handleDataResponse(yield q.exec(), 200, res, next);
        });

        this.coroutines.postResource.main = Promise.coroutine(function* (req, res, next, config) {
            var user = yield mongoose.model('User').create(req.body);

            yield user.sendConfirmationMail();

            return rHandler.handleDataResponse(user, 201, res, next);
        });

        this.coroutines.confirmUserResource = {
            main: Promise.coroutine(function* (req, res, next, config) {
                var user = yield mongoose.model('User').findOne({single_access_token: req.params.token}).exec();

                yield user.confirmUser();

                rHandler.handleDataResponse(user, 201, res, next);
            }),
            pre: Promise.resolve
        };

        this.coroutines.resetUserResource = {
            main: Promise.coroutine(function* (req, res, next, config) {
                var user = yield mongoose.model('User').findOne({email: req.params.email}).exec();

                yield user.sendPasswordResetMail();

                rHandler.handleDataResponse(user, 201, res, next);
            }),
            pre: Promise.resolve
        };

        this.coroutines.putResource.pre = function (req, res, next, config) {
            if (req.user.uuid !== req.params.uuid) {
                throw new restify.NotAuthorizedError();
            }
        };

        this.coroutines.delResource.pre = function (req, res, next, config) {
            if (req.user.uuid !== req.params.uuid) {
                throw new restify.NotAuthorizedError();
            }
        };
    }
}

module.exports = UsersController;