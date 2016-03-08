'use strict';

var photos = require('../controllers/photos'),
    CommonController = require('../controllers/common'),
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
            controller: res.map('del', {resource: 'Photo'}),
            overrideVerb: 'del',
            scope: 'owner'
        }
    }
};