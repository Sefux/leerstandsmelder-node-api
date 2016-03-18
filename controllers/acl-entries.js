'use strict';

var mongoose = require('mongoose'),
    Promise = require('bluebird'),
    rHandler = require('../lib/util/response-handlers'),
    acl = require('../lib/auth/acl-manager'),
    CommonController = require('./common');

class AclEntriesController extends CommonController {
    constructor() {
        super();

        this.coroutines.getResource.main = Promise.coroutine(function* (req, res, next, config) {
            return rHandler.handleDataResponse(
                yield acl.isAllowed('/' + req.params.resource + '/' + req.params.uuid),
                200, res, next
            );
        });
    }
}