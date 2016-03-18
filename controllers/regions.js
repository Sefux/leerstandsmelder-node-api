'use strict';

var mongoose = require('mongoose'),
    Promise = require('bluebird'),
    rHandler = require('../lib/util/response-handlers'),
    CommonController = require('./common');

class RegionsController extends CommonController {
    constructor() {
        super();

        this.coroutines.findResource.main = Promise.coroutine(function* (req, res, next, config) {
            if (req.params.lat && req.params.lon) {
                var q = mongoose.model('Region').where('lonlat');
                q.near({
                    center: {coordinates: [parseFloat(req.params.lon), parseFloat(req.params.lat)], type: 'Point'}
                });
                q.limit(1);
                q.exec().then(function (results) {
                    rHandler.handleDataResponse(results, 200, res, next);
                });
            } else {
                return Promise.resolve()
                    .then(function () {
                        return mongoose.model('Location').mapReduce({
                            map: function () {
                                emit(this.region_uuid, 1);
                            },
                            reduce: function (k, v) {
                                return Array.sum(v);
                            }
                        });
                    })
                    .then(function (results) {
                        var output = [];
                        return Promise.map(results, function (item) {
                                return mongoose.model('Region').findOne({uuid: item._id})
                                    .then(function (region) {
                                        var out = region.toObject();
                                        out.locations = item.value;
                                        output.push(out);
                                    });
                            }, {concurrency: 1})
                            .then(function () {
                                return output;
                            });
                    })
                    .then(function (results) {
                        rHandler.handleDataResponse(results, 200, res, next);
                    });
            }
        });

    }
}

module.exports = RegionsController;