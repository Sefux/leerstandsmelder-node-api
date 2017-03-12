'use strict';

var mongoose = require('mongoose'),
    Promise = require('bluebird'),
    rHandler = require('../lib/util/response-handlers'),
    CommonController = require('./common');

class PingController extends CommonController {
    constructor() {
        super();

        this.coroutines.getResource.main = Promise.coroutine(function* (req, res, next) {
            rHandler.handleDataResponse({serverStatus: 'running'}, 200, res, next);
        });
    }
}

module.exports = PingController;
