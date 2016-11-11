'use strict';

var mongoose = require('mongoose'),
    restify = require('restify'),
    Promise = require('bluebird'),
    rHandler = require('../lib/util/response-handlers'),
    conditionalAdd = require('../lib/util/conditional-add'),
    CommonController = require('./common');

class LocationsController extends CommonController {
    constructor() {
        super();

        this.coroutines.findResource.main = Promise.coroutine(function* (req, res, next, config) {
            let query, q, maxdist = parseFloat(req.query.radius || 2000) / 6371,
                limit = Math.min(Math.max(parseInt(req.query.limit || 1000), 0), 1000),
                skip = Math.max(parseInt(req.query.skip || 0), 0),
                uuid = req.params.region_uuid || req.params.uuid,
                region = yield mongoose.model('Region').findOne({$or: [{uuid: uuid}, {slug: uuid}]}),
                isAdmin = req.api_key && (
                    req.api_key.scopes.indexOf('admin') ||
                    req.api_key.scopes.indexOf('region-' + region.uuid)
                );

            if (!region && !config.query.user_mapping) {
                return rHandler.handleErrorResponse(new restify.NotFoundError(), res, next);
            }

            query = require('../lib/util/query-mapping')({}, req, config);
            query = conditionalAdd(query, 'hidden', false, !isAdmin);
            query = conditionalAdd(query, 'region_uuid', region ? region.uuid : undefined);
            query = conditionalAdd(query, 'lonlat', {
                $near: [parseFloat(req.query.longitude || 10.0014), parseFloat(req.query.latitude || 53.5653)],
                $maxDistance: maxdist
            }, (req.query.longitude !== undefined && req.query.latitude !== undefined));

            q = mongoose.model(config.resource).find(query);
            q = req.query.sort ? q.sort(req.query.sort) : q;
            q = config.select ? q.select(config.select) : q;
            q = q.skip(skip).limit(limit);

            var data = { page: Math.floor(skip / limit), pagesize: limit };
            data.results = yield q.exec();
            data.total = yield mongoose.model(config.resource).count(q._conditions);

            yield Promise.map(data.results, Promise.coroutine(function* (result) {
                result = result.toObject();
                result.user = yield mongoose.model('User').findOne({uuid: result.user_uuid})
                    .select('uuid nickname').exec();
                result.region = yield mongoose.model('Region').findOne({uuid: result.region_uuid})
                    .select('uuid title slug').exec();
                let photo = yield mongoose.model('Photo').findOne({location_uuid: result.uuid})
                    .select('thumb_url uuid extension').exec();
                result = conditionalAdd(result, 'thumb_url', photo ? photo.thumb_url : undefined);
                return result;
            }));

            rHandler.handleDataResponse(data, 200, res, next);
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