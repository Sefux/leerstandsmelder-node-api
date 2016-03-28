'use strict';

var LocationsController = require('../controllers/locations'),
    res = new LocationsController();

module.exports = {
    '/locations': {
        'get': {
            controller: res.map('find', {resource: 'Location', select: 'uuid user_uuid title lonlat postcode city street owner buildingType created updated'}),
            scope: 'public'
        },
        'post': {
            controller: res.map('post', {resource: 'Location'}),
            scope: 'user'
        }
    },
    '/locations/:uuid': {
        'get': {
            controller: res.map('get', {resource: 'Location'}),
            scope: 'public'
        },
        'put': {
            controller: res.map('put', {resource: 'Location'}),
            scope: 'owner'
        },
        'delete': {
            controller: res.map('del', {resource: 'Location'}),
            overrideVerb: 'del',
            scope: 'owner'
        }
    },
    '/locations/:uuid/photos': {
        'get': {
            controller: res.map('find', {resource: 'Photo', query: {id_mapping: 'location_uuid'}}),
            scope: 'public'
        }
    },
    '/locations/:uuid/comments': {
        'get': {
            controller: res.map('find', {resource: 'Comment', query: {id_mapping: 'subject_uuid'}}),
            scope: 'public'
        }
    },
    '/search/locations': {
        'get': {
            controller: res.map('search', {
                resource: 'Location',
                select: 'uuid slug title lonlat street postcode city created updated'
            }),
            scope: 'public'
        }
    },
    '/search/locations/:uuid': {
        'get': {
            controller: res.map('search', {
                resource: 'Location',
                select: 'uuid region_uuid slug title lonlat street postcode city created updated'
            }),
            scope: 'public'
        }
    }
};