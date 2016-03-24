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

        function updateUUID(req) {
            if (req.params.uuid === 'me' && req.user) {
                req.params.uuid = req.user.uuid;
            }
            return Promise.resolve();
        }

        function preHandler(req) {
            updateUUID(req);
            if (req.user.uuid !== req.params.uuid) {
                throw new restify.NotAuthorizedError();
            }
            return Promise.resolve();
        }

        this.coroutines.getResource.pre = updateUUID;
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

            yield acl.setAclEntry(
                '/users/' + user.uuid,
                [user.uuid, 'admin'],
                ['get', 'put', 'delete']
            );
            yield acl.setAclEntry('/users/' + user.uuid, ['user'], ['get']);
            yield acl.setAclEntry('/users/me', [user.uuid], ['get', 'put', 'delete']);
            yield user.sendConfirmationMail();

            return rHandler.handleDataResponse(user, 201, res, next);
        });

        this.coroutines.putResource.pre = preHandler;
        this.coroutines.putResource.main = Promise.coroutine(function* (req, res, next, config) {
            var q, user = yield mongoose.model('User').findOne({uuid: req.params.uuid});
            if (req.body.password) {
                user.password = req.body.password;
                yield user.save();
                delete req.body.password;
            }
            q = mongoose.model('User').update({uuid: req.params.uuid}, req.body, {new: true});
            rHandler.handleDataResponse(yield q.exec(), 200, res, next);
        });

        this.coroutines.resetUserResource = {
            main: Promise.coroutine(function* (req, res, next, config) {
                var user = yield mongoose.model('User').findOne({email: req.body.email}).exec();

                yield user.requestPasswordReset();

                rHandler.handleDataResponse(user, 201, res, next);
            }),
            pre: Promise.resolve
        };

        this.coroutines.delResource.pre = preHandler;
    }
}

module.exports = UsersController;