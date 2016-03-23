'use strict';

var mongoose = require('mongoose'),
    Promise = require('bluebird'),
    aclManager = require('../lib/auth/acl-manager'),
    rHandler = require('../lib/util/response-handlers');

class CommonController {
    constructor() {
        this.coroutines = {
            findResource: {
                main: Promise.coroutine(function* (req, res, next, config) {
                    if (req.params.uuid === 'me' && req.user) {
                        req.params.uuid = req.user.uuid;
                    }
                    var query = require('../lib/util/query-mapping')({}, req, config),
                        q = mongoose.model(config.resource).find(query);
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
                    var results = yield q.exec();
                    if (results.length > 0 && results[0].user_uuid) {
                        var output = [];
                        return Promise.map(results, function (result) {
                                return mongoose.model('User')
                                    .findOne({uuid: result.user_uuid})
                                    .select('uuid nickname').exec()
                                    .then(function (user) {
                                        result = result.toObject();
                                        result.user = user;
                                        output.push(result);
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
                    var q = mongoose.model(config.resource)
                        .findOne({$or: [{uuid: req.params.uuid}, {slug: req.params.uuid}]});
                    q = config.select ? q.select(config.select) : q;
                    var result = yield q.exec();
                    result = result.toObject();
                    if (result.user_uuid) {
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
                    if (req.user && req.user.uuid) req.body.user_uuid = req.user.uuid;
                    rHandler.handleDataResponse(
                        yield mongoose.model(config.resource)
                            .create(req.body)
                            .then(function (result) {
                                if (!req.user || !req.user.uuid) return result;
                                return aclManager.setAclEntry(req.path + '/' + result.uuid, [req.user.uuid, 'admin'], ['get', 'put', 'post', 'delete'])
                                    .then(() => {
                                        return aclManager.setAclEntry(req.path + '/' + result.uuid, ['user'], ['get']);
                                    })
                                    .then(() => {
                                        return result;
                                    });
                            }),
                        201, res, next
                    );
                }),
                pre: Promise.resolve
            },
            putResource: {
                main: Promise.coroutine(function* (req, res, next, config) {
                    var q = mongoose.model(config.resource)
                        .findOneAndUpdate({uuid: req.params.uuid}, req.body, {new: true});
                    rHandler.handleDataResponse(yield q.exec(), 200, res, next);
                }),
                pre: Promise.resolve
            },
            delResource: {
                main: Promise.coroutine(function* (req, res, next, config) {
                    rHandler.handleDataResponse(
                        yield mongoose.model(config.resource)
                            .findOneAndRemove({uuid: req.params.uuid})
                            .then((result) => {
                                return aclManager.removeAclEntry(req.path, req.user.uuid, '*')
                                    .then(() => {
                                        return aclManager.removeAclEntry(req.path, 'admin', '*');
                                    })
                                    .then(() => {
                                        return aclManager.removeAclEntry(req.path, 'user', '*');
                                    })
                                    .then(() => {
                                        return result;
                                    });
                            }),
                        200, res, next
                    );
                }),
                pre: Promise.resolve
            }
        };
    }

    map(verb, config) {
        var instance = this;
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