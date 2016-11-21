'use strict';

var mongoose = require('mongoose'),
    restify = require('restify'),
    Promise = require('bluebird'),
    aclManager = require('../lib/auth/acl-manager'),
    rHandler = require('../lib/util/response-handlers');

class CommonController {
    constructor() {

        function deleteProtected(req) {
            delete req.body.region_uuid;
            delete req.body.user_uuid;
            delete req.body.legacy_id;
        }

        this.coroutines = {
            findResource: {
                main: Promise.coroutine(function* (req, res, next, config) {
                    if (req.params.uuid === 'me' && req.user) {
                        req.params.uuid = req.user.uuid;
                    }
                    let query = require('../lib/util/query-mapping')({}, req, config);

                    let paths = mongoose.model(config.resource).schema.paths;
                    if (paths.hasOwnProperty('hidden')) {
                        query.hidden = false;
                    }

                    let q = mongoose.model(config.resource).find(query);
                    q = config.select ? q.select(config.select) : q;
                    if (req.params.skip) {
                        q = q.skip(parseInt(req.params.skip));
                    }
                    if (req.params.limit) {
                        q = q.limit(parseInt(req.params.limit));
                    }
                    if (req.params.sort) {
                        q = q.sort(req.params.sort);
                    }
                    let results = yield q.exec();
                    if (results.length > 0 && results[0].user_uuid) {
                        let output = [];
                        return Promise.map(results, function (result) {
                                return mongoose.model('User')
                                    .findOne({uuid: result.user_uuid})
                                    .select('uuid nickname').exec()
                                    .then(function (user) {
                                        if (result) {
                                            result = result.toObject();
                                            result.user = user;
                                            output.push(result);
                                        }
                                    });
                            })
                            .then(function () {
                                rHandler.handleDataResponse(output, 200, res, next);
                            });
                    } else {
                        rHandler.handleDataResponse(results, 200, res, next);
                    }
                }),
                pre: Promise.resolve
            },
            getResource: {
                main: Promise.coroutine(function* (req, res, next, config) {
                    let query = {$or: [{uuid: req.params.uuid}, {slug: req.params.uuid.toLowerCase()}]},
                        paths = mongoose.model(config.resource).schema.paths,
                        q = mongoose.model(config.resource).findOne(query);
                    q = config.select ? q.select(config.select) : q;
                    let result = yield q.exec();
                    if (result) {
                        result = result.toObject();
                    } else {
                        return rHandler.handleErrorResponse(new restify.NotFoundError(), res, next);
                    }
                    if (paths.hasOwnProperty('hidden') && result.hidden) {
                        let region = yield mongoose.model('Region').findOne({uuid:result.region_uuid});
                        if (!region) {
                            return rHandler.handleErrorResponse(new restify.NotFoundError(), res, next);
                        }
                        // TODO: put this in lib
                        let isAdmin = req.api_key && (
                                req.api_key.scopes.indexOf('admin') ||
                                req.api_key.scopes.indexOf('region-' + region.uuid)
                            );
                        if (!isAdmin) {
                            return rHandler.handleErrorResponse(new restify.NotFoundError(), res, next);
                        }
                    }
                    if (result && result.user_uuid) {
                        result.user = yield mongoose.model('User')
                            .findOne({uuid:result.user_uuid})
                            .select('uuid nickname').exec();
                    }
                    rHandler.handleDataResponse(result, 200, res, next);
                }),
                pre: Promise.resolve
            },
            postResource: {
                main: Promise.coroutine(function* (req, res, next, config) {
                    if (req.user && req.user.uuid && !req.body.user_uuid) req.body.user_uuid = req.user.uuid;
                    let defaultAcl = [req.user.uuid, 'admin'];
                    if (req.body.hasOwnProperty('region_uuid')) {
                        let region = yield mongoose.model('Region').findOne({uuid: req.body.region_uuid});
                        if (region) {
                            req.body.hidden = region.moderate || false;
                            defaultAcl = defaultAcl.concat(['region-' + region.uuid]);
                        }
                    }
                    let result = yield mongoose.model(config.resource).create(req.body);
                    yield aclManager.setAclEntry(
                        req.url + '/' + result.uuid,
                        defaultAcl,
                        ['get', 'put', 'delete']
                    );
                    yield aclManager.setAclEntry(req.url + '/' + result.uuid, ['user'], ['get']);
                    rHandler.handleDataResponse(result, 201, res, next);
                }),
                pre: Promise.resolve
            },
            putResource: {
                main: Promise.coroutine(function* (req, res, next, config) {
                    let data = yield mongoose.model(config.resource).findOne({uuid: req.params.uuid}).exec();
                    if (data) {
                        for (var key in req.body) {
                            data[key] = req.body[key];
                        }
                        yield data.save();
                        rHandler.handleDataResponse(data, 200, res, next);
                    } else {
                        rHandler.handleErrorResponse(new restify.NotFoundError(), res, next);
                    }
                }),
                pre: Promise.resolve
            },
            delResource: {
                main: Promise.coroutine(function* (req, res, next, config) {
                    let result = yield mongoose.model(config.resource).findOneAndRemove({uuid: req.params.uuid});
                    if (result) {
                        yield aclManager.removeAclEntry(req.url, req.user.uuid, '*');
                        yield aclManager.removeAclEntry(req.url, 'admin', '*');
                        yield aclManager.removeAclEntry(req.url, 'user', '*');
                        rHandler.handleDataResponse(result, 200, res, next);
                    } else {
                        rHandler.handleErrorResponse(new restify.NotFoundError(), res, next);
                    }
                }),
                pre: Promise.resolve
            }
        };
    }

    map(verb, config) {
        let instance = this;
        return function executeRequest(req, res, next) {
            return Promise.resolve()
                .then(() => {
                    return instance.coroutines[`${verb}Resource`].pre(req, res, next, config);
                })
                .then(() => {
                    return instance.coroutines[`${verb}Resource`].main(req, res, next, config);
                })
                .catch(err => {
                    rHandler.handleErrorResponse(err, res, next);
                });
        };
    }
}

module.exports = CommonController;