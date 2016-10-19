'use strict';

var AclEntriesController = require('../controllers/acl-entries'),
    swagger = require('swagger-node-restify'),
    res = new AclEntriesController();

module.exports = {
    "/acl/:resource/:uuid": {
        'get': {
            controller: res.map('get', {resource: 'AclEntry'}),
            scope: 'user',
            'spec': {
                "description" : "Request an ACL entry for a resource",
                "notes" : "",
                "summary" : "Request ACL Entry",
                "parameters" : [
                    swagger.pathParam("resource", "Resource UUID", "string"),
                    swagger.pathParam("uuid", "User UUID", "string")
                ],
                "type" : "AclEntry",
                "errorResponses" : [swagger.errors.notFound('AclEntry')],
                "nickname" : "getAclEntry"
            }
        }
    }
};