'use strict';

var RegionsController = require('../controllers/regions'),
    res = new RegionsController();

module.exports = {
    '/regions': {
        'post': {
            controller: res.map('post', {resource: 'Region'}),
            scope: 'admin'
        },
        'get': {
            controller: res.map('find', {resource: 'Region'}),
            scope: 'public'
        }
    },
    '/regions/:uuid': {
        'get': {
            controller: res.map('get', {resource: 'Region'}),
            scope: 'public'
        },
        'put': {
            controller: res.map('put', {resource: 'Region'}),
            scope: 'admin'
        },
        'delete': {
            controller: res.map('del', {resource: 'Region'}),
            overrideVerb: 'del',
            scope: 'admin'
        }
    },
    '/regions/:uuid/locations': {
        'get': {
            controller: res.map('find', {
                resource: 'Location',
                query: {id_mapping: 'region_uuid'},
                select: 'uuid title lonlat postcode city created updated'
            }),
            scope: 'public'
        }
    }
};