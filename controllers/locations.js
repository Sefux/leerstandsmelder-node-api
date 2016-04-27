'use strict';

var mongoose = require('mongoose'),
    restify = require('restify'),
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
                geoquery, query, q, isAdmin = false;

            let uuid = req.params.region_uuid || req.params.uuid,
                region = yield mongoose.model('Region').findOne({$or: [{uuid: uuid}, {slug: uuid}]});

            if (!region && !config.query.user_mapping) {
                return rHandler.handleErrorResponse(new restify.NotFoundError(), res, next);
            }

            geoquery = {};

            if (region) {
                // TODO: put this in lib
                isAdmin = req.api_key && (
                    req.api_key.scopes.indexOf('admin') ||
                    req.api_key.scopes.indexOf('region-' + region.uuid)
                );
                geoquery.region_uuid = region.uuid;
            }

            if (req.query.longitude && req.query.latitude) {
                geoquery.lonlat = {
                    $near: [parseFloat(req.query.longitude || 10.0014), parseFloat(req.query.latitude || 53.5653)],
                    $maxDistance: maxdist
                };
            }

            if (!isAdmin) {
                geoquery.hidden = false;
            }

            query = require('../lib/util/query-mapping')(geoquery, req, config);
            q = mongoose.model(config.resource).find(query);
            if (req.query.sort) {
                q = q.sort(req.params.sort);
            }

            q = config.select ? q.select(config.select) : q;
            if (page < 0) page = 0;
            if (pagesize < 0) pagesize = 25;
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
                                $and: [
                                    { hidden: false },
                                    {
                                        $or: [
                                            {title: {$regex: reg}},
                                            {description: {$regex: reg}},
                                            {owner: {$regex: reg}},
                                            {street: {$regex: reg}},
                                            {city: {$regex: reg}},
                                            {postcode: {$regex: reg}},
                                            {street: {$regex: reg}}
                                        ]
                                    }
                                ]
                            };
                        })
                    };
                if (req.params.uuid) {
                    query.region_uuid = req.params.uuid;
                }
                var q = mongoose.model('Location').find(query);
                q = config.select ? q.select(config.select) : q;
                let result = yield q.exec(),
                    regions = {};
                if (Array.isArray(result)) {
                    for (let i = 0; i < result.length; i+=1) {
                        let item = result[i].toObject();
                        if (!regions.hasOwnProperty(item.region_uuid)) {
                            let region = yield mongoose.model('Region').findOne({uuid: item.region_uuid});
                            if (region) {
                                regions[item.region_uuid] = region.slug;
                            }
                        }
                        item.region_slug = regions[item.region_uuid];
                        result[i] = item;
                    }
                }
                rHandler.handleDataResponse(result, 200, res, next);
            })
        };
    }
}

module.exports = LocationsController;