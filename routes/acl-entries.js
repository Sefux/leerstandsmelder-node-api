'use strict';

var AclEntriesController = require('../controllers/acl-entries'),
    res = new AclEntriesController();

module.exports = {
    '/acl/:resource/:uuid': {
        'post': {
            controller: res.map('get', {resource: 'AclEntry'}),
            scope: 'user'
        }
    }
};