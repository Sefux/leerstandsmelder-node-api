'use strict';

var mongoose = require('mongoose'),
    restify = require('restify'),
    Promise = require('bluebird'),
    workers = require('../lib/workers'),
    rHandler = require('../lib/util/response-handlers'),
    acl = require('../lib/auth/acl-manager'),
    CommonController = require('./common');

class UsersController extends CommonController {
    constructor() {
        super();

        function deleteProtected(req) {
            delete req.body.scopes;
            delete req.body.single_access_token;
            delete req.body.failed_logins;
            delete req.body.crypted_password;
            delete req.body.password_salt;
            delete req.body.legacy_id;
        }

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
                selectAttributes = 'uuid nickname email';
            }

            var q = mongoose.model(config.resource)
                .findOne({uuid: req.params.uuid, confirmed: true, blocked: false})
                .select(selectAttributes);
            let result = yield q.exec();
            if (result) {
                rHandler.handleDataResponse(result, 200, res, next);
            } else {
                rHandler.handleErrorResponse(new restify.NotFoundError(), res, next);
            }
        });

        this.coroutines.postResource.main = Promise.coroutine(function* (req, res, next) {
            deleteProtected(req);

            var user = yield mongoose.model('User').create(req.body);
            yield acl.setAclEntry(
                '/users/' + user.uuid,
                [user.uuid, 'admin'],
                ['get', 'put', 'delete']
            );
            yield acl.setAclEntry('/users/' + user.uuid, ['user'], ['get']);
            yield acl.setAclEntry('/users/me', [user.uuid], ['get', 'put', 'delete']);
            if (!req.query || !req.query.hasOwnProperty('noconfirm')) {
                yield workers.sendConfirmationMail(user.uuid);
            }

            return rHandler.handleDataResponse(user, 201, res, next);
        });

        this.coroutines.putResource.pre = preHandler;
        this.coroutines.putResource.main = Promise.coroutine(function* (req, res, next) {
            var user = yield mongoose.model('User').findOne({uuid: req.params.uuid, confirmed: true, blocked: false});
            deleteProtected(req);
            if (req.user.scopes.indexOf('admin') === -1) {
                delete req.body.confirmed;
                delete req.body.blocked;
            }
            if (req.body.password) {
                user.password = req.body.password;
                yield user.save();
                delete req.body.password;
            }
            for (var key in req.body) {
                if (user[key]) {
                    user[key] = req.body[key];
                }
            }
            yield user.save();
            rHandler.handleDataResponse(user, 200, res, next);
        });

        this.coroutines.resetUserResource = {
            main: Promise.coroutine(function* (req, res, next) {
                var user = yield mongoose.model('User').findOne({email: req.body.email, blocked: false}).exec();
                yield workers.sendResetMail(user.uuid);

                rHandler.handleDataResponse(user, 201, res, next);
            }),
            pre: Promise.resolve
        };

        this.coroutines.deleteResource.pre = preHandler;
    }
}

module.exports = UsersController;