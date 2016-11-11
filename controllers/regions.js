'use strict';

var mongoose = require('mongoose'),
    Promise = require('bluebird'),
    rHandler = require('../lib/util/response-handlers'),
    CommonController = require('./common');

class RegionsController extends CommonController {
    constructor() {
        super();

        this.coroutines.findResource.main = Promise.coroutine(function* (req, res, next, config) {
            let limit = parseInt(req.query.limit || 0),
                skip = parseInt(req.query.skip || 0),
                lat = req.params.lat || req.query.lat,
                lon = req.params.lon || req.query.lon;
            if (lat && lon) {
                let q = mongoose.model('Region').where('lonlat');
                q.near({
                    center: {coordinates: [lon, lat], type: 'Point'}
                });
                q = config.select ? q.select(config.select) : q;
                if (req.query.sort) {
                    q = q.sort(req.query.sort);
                }
                if (req.query.limit) {
                    q = q.limit(limit);
                }
                if (req.query.skip) {
                    q = q.skip(skip);
                }
                let results = yield q.exec(),
                    data = {page: Math.floor(skip / limit), pagesize: limit};

                data.results = yield q.exec();
                data.total = yield mongoose.model(config.resource).count(q._conditions);

                rHandler.handleDataResponse(results, 200, res, next);
            } else {
                var results = yield mongoose.model('Location').mapReduce({
                    map: function () {
                        if (!this.hide) {
                            emit(this.region_uuid, 1); // jshint ignore:line
                        }
                    },
                    reduce: function (k, v) {
                        return Array.sum(v);
                    }
                });

                var output = [];

                yield Promise.map(results, function (item) {
                    return mongoose.model('Region').findOne({uuid: item._id, hide:false})
                        .then(function (region) {
                            if (region) {
                                var out = region.toObject();
                                out.locations = item.value;
                                output.push(out);
                            }
                        });
                }, {concurrency: 1});

                if (req.query.sort) {
                    // function lifted from http://stackoverflow.com/a/4760279/578963
                    // FIXME: and apparently is not working too well...?
                    output.sort(function sortOn(property) {
                        var sortOrder = 1;
                        if (req.query.sort[0] === "-") {
                            sortOrder = -1;
                            req.query.sort = req.query.sort.substr(1);
                        }
                        return function (a, b) {
                            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                            return result * sortOrder;
                        };
                    });
                }

                let total = output.length,
                    data = {page: Math.floor(skip / limit), pagesize: limit};
                data.total = total;
                data.results = output.slice(skip, limit || total);

                rHandler.handleDataResponse(data, 200, res, next);
            }
        });

    }
}

module.exports = RegionsController;