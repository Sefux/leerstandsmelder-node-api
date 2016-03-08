'use strict';

var CommonController = require('../controllers/common'),
    LocationsController = require('../controllers/locations'),
    res = new CommonController(),
    locations = new LocationsController();

module.exports = {
    '/locations': {
        'get': {
            controller: locations.map('find', {resource: 'Location', select: 'uuid title lonlat postcode city created updated'}),
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
    }
};