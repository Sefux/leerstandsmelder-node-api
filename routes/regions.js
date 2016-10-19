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
            controller: res.map('delete', {resource: 'Region'}),
            scope: 'admin'
        }
    },
    '/regions/:uuid/locations': {
        'get': {
            controller: locations.map('find', {
                resource: 'Location',
                select: 'uuid user_uuid region_uuid slug title lonlat postcode street city buildingType owner hidden active created updated'
            }),
            scope: 'public'
        }
    }
};