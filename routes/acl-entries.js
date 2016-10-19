'use strict';

var swagger = require('swagger-node-restify'),
    AclEntriesController = require('../controllers/acl-entries'),
    res = new AclEntriesController();

module.exports = {
    '/acl/:resource/:uuid': {
        'get': {
            controller: res.map('get', {resource: 'AclEntry'}),
            scope: 'user',
            spec: {
                description: 'Request an ACL entry for a resource',
                summary: 'Request ACL Entry',
                params: [
                    swagger.pathParam('resource', 'Resource UUID', 'string'),
                    swagger.pathParam('uuid', 'User UUID', 'string')
                ],
                errorResponses: [swagger.errors.notFound('AclEntry')],
                nickname: 'getAclEntry',
                responseClass: 'AclEntry'
            }
        }
    }
};