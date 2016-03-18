'use strict';

var RegionsController = require('../controllers/regions'),
    LocationsController = require('../controllers/locations'),
    res = new RegionsController(),
    locations = new LocationsController();

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
            controller: locations.map('find', {
                resource: 'Location',
                query: {id_mapping: 'region_uuid'},
                select: 'uuid slug title lonlat postcode city created updated'
            }),
            scope: 'public'
        }
    },
    '/search/regions/:uuid': {
        'get': {
            controller: res.map('search', {
                resource: 'Location',
                select: 'uuid slug title lonlat street postcode city created updated'
            }),
            scope: 'public'
        }
    }
};