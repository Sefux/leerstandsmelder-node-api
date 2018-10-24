'use strict';

var mongoose = require('mongoose'),
    restifyErrors = require('restify-errors'),
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

                      /*var isAdmin = req.api_key &&  req.api_key.scopes && (
                              req.api_key.scopes.indexOf("admin") > -1
                          );*/

                          //if(!isAdmin) {
                              query.hidden = false;
                          //}
                    }

                    let limit = Math.abs(parseInt(req.query.limit) || 5),
                        skip = Math.abs(parseInt(req.query.skip) || 0),
                        q = mongoose.model(config.resource).find(query);

                    q = config.select ? q.select(config.select) : q;
                    q = req.query.skip ? q.skip(skip) : q;
                    q = req.query.limit ? q.limit(limit) : q;
                    q = req.query.sort ? q.sort(req.query.sort) : q.sort({"created":-1});

                    var data = {page: Math.floor(skip / limit), pagesize: limit},
                        results = yield q.exec();
                    data.total = yield mongoose.model(config.resource).count(q._conditions);

                    data.results = yield Promise.map(results, Promise.coroutine(function* (result) {
                        result = result.toObject();
                        if (result.user_uuid) {
                            result.user = yield mongoose.model("User").findOne({uuid: result.user_uuid})
                                .select("uuid nickname").exec();
                            result.user = result.user ? result.user.toObject() : undefined;
                        }
                        if (result.subject_uuid) {
                            result.location = yield mongoose.model("Location")
                                .findOne({uuid:result.subject_uuid})
                                .select("uuid title city").exec();
                            result.location = result.location ? result.location.toObject() : undefined;
                        }
                        return result;
                    }));

                    rHandler.handleDataResponse(data, 200, res, next);
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
                    if (!result) {
                        return rHandler.handleErrorResponse(new restifyErrors.NotFoundError(), res, next);
                    }
                    result = result.toObject();

                    if (result && result.user_uuid) {
                        result.user = yield mongoose.model("User")
                            .findOne({uuid:result.user_uuid})
                            .select("uuid nickname").exec();
                        result.user = result.user ? result.user.toObject() : undefined;
                    }
                    if (result && result.subject_uuid) {
                        result.location = yield mongoose.model("Location")
                            .findOne({uuid:result.subject_uuid})
                            .select("uuid title city").exec();
                        result.location = result.location ? result.location.toObject() : undefined;
                    }
                    if (paths.hasOwnProperty("hidden") && result.hidden) {
                        var region_uuid = result.region_uuid || result.location.region_uuid;
                        // TODO: put this in lib
                        var isAdmin = req.api_key && req.api_key.scopes && (
                                req.api_key.scopes.indexOf("admin") > -1 ||
                                req.api_key.scopes.indexOf("region-" + region_uuid) > -1
                            );

                        if (!isAdmin) {
                            return rHandler.handleErrorResponse(new restifyErrors.NotFoundError(), res, next);
                        }
                    }
                    rHandler.handleDataResponse(result, 200, res, next);
                }),
                pre: Promise.resolve
            },
            postResource: {
                main: Promise.coroutine(function* (req, res, next, config) {
                    if (req.user && req.user.uuid && !req.body.user_uuid) req.body.user_uuid = req.user.uuid;
                    let defaultAcl = [req.user.uuid, "admin"];
                    if (req.body.hasOwnProperty("region_uuid")) {
                        let region = yield mongoose.model("Region").findOne({uuid: req.body.region_uuid});
                        if (region) {
                            req.body.hidden = region.moderate || false;
                            defaultAcl = defaultAcl.concat(["region-" + region.uuid]);
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
                    deleteProtected(req);
                    let data = yield mongoose.model(config.resource).findOne({uuid: req.params.uuid}).exec();
                    if (data) {
                        for (var key in req.body) {
                            data[key] = req.body[key];
                        }
                        yield data.save();
                        rHandler.handleDataResponse(data, 200, res, next);
                    } else {
                        rHandler.handleErrorResponse(new restifyErrors.NotFoundError(), res, next);
                    }
                }),
                pre: Promise.resolve
            },
            deleteResource: {
                main: Promise.coroutine(function* (req, res, next, config) {
                    let result = yield mongoose.model(config.resource).findOneAndRemove({uuid: req.params.uuid});
                    if (result) {
                        yield aclManager.removeAclEntry(req.url, req.user.uuid, '*');
                        yield aclManager.removeAclEntry(req.url, 'admin', '*');
                        yield aclManager.removeAclEntry(req.url, 'user', '*');
                        rHandler.handleDataResponse(result, 200, res, next);
                    } else {
                        rHandler.handleErrorResponse(new restifyErrors.NotFoundError(), res, next);
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
