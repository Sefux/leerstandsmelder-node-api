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
                q = config.select ? q.select(config.select) : q;
                if (req.params.skip) {
                    q = q.skip(parseInt(req.params.skip));
                }
                if (req.params.limit) {
                    q = q.limit(parseInt(req.params.limit) || 1);
                }
                if (req.params.sort) {
                    q = q.sort(req.params.sort);
                }
                q.exec().then(function (results) {
                    rHandler.handleDataResponse(results, 200, res, next);
                });
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

                if (req.params.sort) {
                    // function lifted from http://stackoverflow.com/a/4760279/578963
                    // FIXME: and apparently is not working too well...?
                    output.sort(function sortOn(property) {
                        var sortOrder = 1;
                        if (req.params.sort[0] === "-") {
                            sortOrder = -1;
                            req.params.sort = req.params.sort.substr(1);
                        }
                        return function (a, b) {
                            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                            return result * sortOrder;
                        };
                    });
                }

                rHandler.handleDataResponse(output, 200, res, next);
            }
        });

    }
}

module.exports = RegionsController;