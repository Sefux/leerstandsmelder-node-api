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
                .findOne({uuid: req.params.uuid})
                .select(selectAttributes);
            rHandler.handleDataResponse(yield q.exec(), 200, res, next);
        });

        this.coroutines.postResource.main = Promise.coroutine(function* (req, res, next, config) {
            deleteProtected(req);

            var user = yield mongoose.model('User').create(req.body);
            yield acl.setAclEntry(
                '/users/' + user.uuid,
                [user.uuid, 'admin'],
                ['get', 'put', 'delete']
            );
            yield acl.setAclEntry('/users/' + user.uuid, ['user'], ['get']);
            yield acl.setAclEntry('/users/me', [user.uuid], ['get', 'put', 'delete']);
            yield workers.sendConfirmationMail(user);

            return rHandler.handleDataResponse(user, 201, res, next);
        });

        this.coroutines.putResource.pre = preHandler;
        this.coroutines.putResource.main = Promise.coroutine(function* (req, res, next, config) {
            var q, user = yield mongoose.model('User').findOne({uuid: req.params.uuid});
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
            q = mongoose.model('User').findOneAndUpdate({uuid: req.params.uuid}, req.body, {new: true});
            rHandler.handleDataResponse(yield q.exec(), 200, res, next);
        });

        this.coroutines.resetUserResource = {
            main: Promise.coroutine(function* (req, res, next, config) {
                var user = yield mongoose.model('User').findOne({email: req.body.email}).exec();
                yield workers.sendResetMail(user);

                rHandler.handleDataResponse(user, 201, res, next);
            }),
            pre: Promise.resolve
        };

        this.coroutines.delResource.pre = preHandler;
    }
}

module.exports = UsersController;