'use strict';

var swagger = require('swagger-node-restify'),
    photos = require('../controllers/photos'),
    ThumbnailsController = require('../controllers/thumbnails'),
    CommonController = require('../controllers/common'),
    thumbnails = new ThumbnailsController(),
    res = new CommonController();

module.exports = {
    '/photos': {
        'post': {
            controller: photos.post,
            scope: 'user',
            spec: {
                path: '/photos',
                description: 'Add a new Photo',
                summary: 'Create Photo',
                params: [
                    swagger.bodyParam('Photo', 'A Photo object', 'Photo')
                ],
                errorResponses: [
                    swagger.errors.invalid('Photo')
                ],
                nickname: 'createPhoto',
                responseClass: 'Photo'
            }
        }
    },
    '/photos/:uuid': {
        'get': {
            controller: photos.get,
            scope: 'public',
            spec: {
                path: '/photos/{uuid}',
                description: 'Get a photo',
                summary: 'Get Photo',
                params: [swagger.pathParam('uuid', 'UUID of the photo', 'string')],
                errorResponses: [swagger.errors.notFound('Photo')],
                nickname: 'getPhoto',
                responseClass: 'Photo'
            }
        },
        'put': {
            controller: res.map('put', {resource: 'Photo'}),
            scope: 'owner',
            spec: {
                path: '/photos/{uuid}',
                description: 'Update a photo',
                summary: 'Update Photo',
                params: [
                    swagger.pathParam('uuid', 'UUID of the photo', 'string'),
                    swagger.bodyParam('Photo', 'A Photo object', 'Photo')
                ],
                errorResponses: [swagger.errors.notFound('Photo')],
                nickname: 'updatePhoto',
                responseClass: 'Photo'
            }
        },
        'delete': {
            controller: res.map('delete', {resource: 'Photo'}),
            scope: 'owner',
            spec: {
                path: '/photos/{uuid}',
                description: 'Delete a photo',
                summary: 'Delete Photo',
                params: [swagger.pathParam('uuid', 'UUID of the photo', 'string')],
                errorResponses: [swagger.errors.notFound('Photo')],
                nickname: 'deletePhoto'
            }
        }
    },
    '/thumbnails/:type/:size/:uuid': {
        'get': {
            controller: thumbnails.map('get', {resource: 'Photo'}),
            scope: 'public',
            spec: {
                path: '/thumbnails/{type}/{size}/{uuid}',
                description: 'Get thumbnail for a photo',
                summary: 'Get Photo Thumbnail',
                params: [
                    swagger.pathParam('type', 'Type of thumbnail', 'string'),
                    swagger.pathParam('size', 'Size of the thumbnail', 'string'),
                    swagger.pathParam('uuid', 'UUID of the photo', 'string')
                ],
                errorResponses: [swagger.errors.notFound('Photo')],
                nickname: 'getPhotoThumbnail',
                responseClass: 'file',
                produces: ['image/jpeg']
            }
        },
    }
};