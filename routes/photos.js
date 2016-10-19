'use strict';

var photos = require('../controllers/photos'),
    ThumbnailsController = require('../controllers/thumbnails'),
    CommonController = require('../controllers/common'),
    thumbnails = new ThumbnailsController(),
    res = new CommonController();

module.exports = {
    '/photos': {
        'post': {
            controller: photos.post,
            scope: 'user'
        }
    },
    '/photos/:uuid': {
        'get': {
            controller: photos.get,
            scope: 'public'
        },
        'put': {
            controller: res.map('put', {resource: 'Photo'}),
            scope: 'owner'
        },
        'delete': {
            controller: res.map('delete', {resource: 'Photo'}),
            scope: 'owner'
        }
    },
    '/thumbnails/:type/:size/:uuid': {
        'get': {
            controller: thumbnails.map('get', {resource: 'Photo'}),
            scope: 'public'
        },
    }
};