'use strict';

var mongoose = require('mongoose'),
    Promise = require('bluebird'),
    rHandler = require('../lib/util/response-handlers'),
    CommonController = require('./common');

class LocationsController extends CommonController {
    constructor() {
        super();

        this.coroutines.findResource.main = Promise.coroutine(function* (req, res, next, config) {
            var maxdist = parseFloat(req.query.radius || 2000) / 6371,
                page = parseInt(req.query.page || 0),
                pagesize = parseInt(req.query.pagesize || 1000),
                geoquery, query, q;

            if (req.query.longitude && req.query.latitude) {
                geoquery = {
                    lonlat: {
                        $near: [parseFloat(req.query.longitude || 10.0014), parseFloat(req.query.latitude || 53.5653)],
                        $maxDistance: maxdist
                    }
                }
            } else {
                geoquery = {};
            }

            query = require('../lib/util/query-mapping')(geoquery, req, config);
            q = mongoose.model(config.resource).find(query);
            if (req.query.sort) {
                q = q.sort(req.params.sort);
            }

            q = config.select ? q.select(config.select) : q;
            q = q.skip(page * pagesize).limit(pagesize);

            var data = yield q.exec(),
                result = {
                    page: page,
                    pagesize: pagesize,
                    total: yield mongoose.model(config.resource).count(q._conditions),
                    results: data
                };

            var output = [];
            return Promise.map(data, function (result) {
                return mongoose.model('User')
                    .findOne({uuid: result.user_uuid})
                    .select('uuid nickname').exec()
                    .then(function (user) {
                        result = result.toObject();
                        result.user = user;
                        return mongoose.model('Photo')
                            .findOne({location_uuid: result.uuid})
                            .select('thumb_url uuid extension')
                            .exec();
                    })
                    .then(function (photo) {
                        if (photo) {
                            result.thumb_url = photo.thumb_url;
                        }
                        return mongoose.model('Region')
                            .findOne({uuid: result.region_uuid})
                            .select('uuid title slug')
                            .exec();
                    })
                    .then(function (region) {
                        result.region = region;
                        output.push(result);
                    });
            })
            .then(function () {
                result.results = output;
                rHandler.handleDataResponse(result, 200, res, next);
            });

        });

        this.coroutines.searchResource = {
            pre: Promise.resolve,
            main: Promise.coroutine(function* (req, res, next, config) {
                var parts = req.params.q.split(' '),
                    query = {
                        $and: parts.map(function (part) {
                            var reg = new RegExp(part, 'i');
                            return {
                                $or: [
                                    {title: {$regex: reg}},
                                    {description: {$regex: reg}},
                                    {owner: {$regex: reg}},
                                    {street: {$regex: reg}},
                                    {city: {$regex: reg}},
                                    {postcode: {$regex: reg}},
                                    {street: {$regex: reg}}
                                ]
                            };
                        })
                    };
                if (req.params.uuid) {
                    query.region_uuid = req.params.uuid;
                }
                var q = mongoose.model('Location').find(query);
                q = config.select ? q.select(config.select) : q;
                rHandler.handleDataResponse(yield q.exec(), 200, res, next);
            })
        };
    }
}

module.exports = LocationsController;