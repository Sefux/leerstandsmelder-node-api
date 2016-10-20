'use strict';

var swagger = require('swagger-node-restify'),
    CommonController = require('../controllers/common'),
    LocationsController = require('../controllers/locations'),
    res = new LocationsController(),
    common = new CommonController();

module.exports = {
    '/locations': {
        'get': {
            controller: res.map('find', {resource: 'Location', select: 'uuid user_uuid title lonlat postcode city street owner buildingType created updated'}),
            scope: 'public',
            spec: {
                path: '/locations',
                description: 'Get list of Locations',
                summary: 'Find Locations',
                nickname: 'findLocations',
                responseClass: 'List[Location]'
            }
        },
        'post': {
            controller: res.map('post', {resource: 'Location'}),
            scope: 'user',
            spec: {
                path: '/locations',
                description: 'Add a new Location',
                summary: 'Create Location',
                params: [
                    swagger.bodyParam('Location', 'A Location object', 'Location')
                ],
                errorResponses: [
                    swagger.errors.invalid('Location')
                ],
                nickname: 'createLocation',
                responseClass: 'Location'
            }
        }
    },
    '/locations/:uuid': {
        'get': {
            controller: res.map('get', {resource: 'Location'}),
            scope: 'public',
            spec: {
                path: '/locations/{uuid}',
                description: 'Get a location',
                summary: 'Get Location',
                params: [swagger.pathParam('uuid', 'UUID of the location', 'string')],
                errorResponses: [swagger.errors.notFound('Location')],
                nickname: 'getLocation',
                responseClass: 'Location'
            }
        },
        'put': {
            controller: res.map('put', {resource: 'Location'}),
            scope: 'owner',
            spec: {
                path: '/locations/{uuid}',
                description: 'Update a location',
                summary: 'Update Location',
                params: [
                    swagger.pathParam('uuid', 'UUID of the location', 'string'),
                    swagger.bodyParam('Location', 'A Location object', 'Location')
                ],
                errorResponses: [
                    swagger.errors.notFound('Location'),
                    swagger.errors.invalid('Location')
                ],
                nickname: 'updateLocation',
                responseClass: 'Location'
            }
        },
        'delete': {
            controller: res.map('delete', {resource: 'Location'}),
            scope: 'owner',
            spec: {
                path: '/locations/{uuid}',
                description: 'Delete a location',
                summary: 'Delete Location',
                params: [swagger.pathParam('uuid', 'UUID of the location', 'string')],
                errorResponses: [swagger.errors.notFound('Location')],
                nickname: 'deleteLocation'
            }
        }
    },
    '/locations/:uuid/photos': {
        'get': {
            controller: common.map('find', {resource: 'Photo', query: {id_mapping: 'location_uuid'}}),
            scope: 'public',
            spec: {
                path: '/locations/{uuid}/photos',
                description: 'Get photos for a location',
                summary: 'Get Location Photos',
                params: [swagger.pathParam('uuid', 'UUID of the location', 'string')],
                errorResponses: [swagger.errors.notFound('Location')],
                nickname: 'getLocationPhotos',
                responseClass: 'List[Photo]'
            }
        }
    },
    '/locations/:uuid/comments': {
        'get': {
            controller: common.map('find', {resource: 'Comment', query: {id_mapping: 'subject_uuid'}}),
            scope: 'public',
            spec: {
                path: '/locations/{uuid}/comments',
                description: 'Get comments for a location',
                summary: 'Get Location Comments',
                params: [swagger.pathParam('uuid', 'UUID of the location', 'string')],
                errorResponses: [swagger.errors.notFound('Location')],
                nickname: 'getLocationComments',
                responseClass: 'List[Comment]'
            }
        }
    },
    '/search/locations': {
        'get': {
            controller: res.map('search', {
                resource: 'Location',
                select: 'uuid slug title lonlat street postcode city created updated'
            }),
            scope: 'public',
            spec: {
                path: '/search/locations',
                description: 'Text search over all locations',
                summary: 'Search Locations',
                params: [swagger.queryParam('q', 'Search query', 'string')],
                nickname: 'searchLocations',
                responseClass: 'List[Location]'
            }
        }
    },
    '/search/locations/:uuid': {
        'get': {
            controller: res.map('search', {
                resource: 'Location',
                select: 'uuid region_uuid slug title lonlat street postcode city created updated'
            }),
            scope: 'public',
            spec: {
                path: '/search/locations/{uuid}',
                description: 'Text search over all locations within a region',
                summary: 'Search Region Locations',
                params: [
                    swagger.pathParam('uuid', 'UUID of a Region', 'string'),
                    swagger.queryParam('q', 'Search query', 'string')
                ],
                nickname: 'searchRegionLocations',
                responseClass: 'List[Location]'
            }
        }
    }
};