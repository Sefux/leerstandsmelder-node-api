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
            if (req.user.uuid !== req.params.uuid && !req.user.scopes.indexOf('admin')) {
                throw new restify.NotAuthorizedError();
            }
            return Promise.resolve();
        }

        this.coroutines.getResource.pre = updateUUID;
        this.coroutines.getResource.main = Promise.coroutine(function* (req, res, next, config) {
            var selectAttributes = 'uuid nickname';

            if (req.user && req.user.uuid === req.params.uuid) {
                selectAttributes = 'uuid nickname email message_me notify';
            }

	        if (req.user.scopes.indexOf('admin') ) {
		        selectAttributes = 'uuid nickname confirmed blocked email message_me notify share_email created updated last_login failed_logins';
	        }

            var q = mongoose.model(config.resource)
                .findOne({uuid: req.params.uuid, confirmed: true, blocked: false})
                .select(selectAttributes);
            let result = yield q.exec();
            /*
            //TODO: as admin i want to see/edited user rights/ACL
	        if (req.user.scopes.indexOf('admin')) {
                //var res = result.toObject();
                result.api_keys = yield mongoose.model('ApiKey').findOne({user_uuid: result.uuid})
                    .select('created updated scopes').exec();
	        }
            */
            if (result) {
                rHandler.handleDataResponse(result, 200, res, next);
            } else {
                rHandler.handleErrorResponse(new restify.NotFoundError(), res, next);
            }
        });
        this.coroutines.findResource.main = Promise.coroutine(function* (req, res, next, config) {
                if (req.params.uuid === 'me' && req.user) {
                    req.params.uuid = req.user.uuid;
                }
                let query = require('../lib/util/query-mapping')({}, req, config);

                let paths = mongoose.model(config.resource).schema.paths;
                if (paths.hasOwnProperty('hidden')) {
                    query.hidden = false;
                }

                let limit = Math.abs(parseInt(req.query.limit) || 5),
                    skip = Math.abs(parseInt(req.query.skip) || 0),
                    q = mongoose.model(config.resource).find(query);

                q = config.select ? q.select(config.select) : q;
                q = req.query.skip ? q.skip(skip) : q;
                q = req.query.limit ? q.limit(limit) : q;
                q = req.query.sort ? q.sort(req.query.sort) : q;

                var data = {page: Math.floor(skip / limit), pagesize: limit},
                    results = yield q.exec();
                data.total = yield mongoose.model(config.resource).count(q._conditions);

                data.results = yield Promise.map(results, Promise.coroutine(function* (result) {
                    result = result.toObject();

                    result.api_keys = yield mongoose.model('ApiKey').findOne({user_uuid: result.uuid})
                        .select('created updated scopes').exec();
                    result.api_keys = result.api_keys ? result.api_keys.toObject() : undefined;

                    return result;
                }));

                rHandler.handleDataResponse(data, 200, res, next);
            });
        this.coroutines.findResource.pre = Promise.resolve;


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
                //TODO: use model.path, otherwise model changes will not work
                //if (user[key]) {
                    user[key] = req.body[key];
                //}
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