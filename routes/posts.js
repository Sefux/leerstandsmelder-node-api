'use strict';

var CommonController = require('../controllers/common'),
    res = new CommonController();

module.exports = {
    '/posts': {
        'post': {
            controller: res.map('post', {resource: 'Post', select: 'uuid title created updated'}),
            scope: 'user'
        },
        'get': {
            controller: res.map('find', {resource: 'Post', query: {$or: [{static: false}, {static: {$exists: false}}]}}),
            scope: 'public'
        }
    },
    '/posts/static': {
        'get': {
            controller: res.map('find', {resource: 'Post', query: {static: true}}),
            scope: 'public'
        }
    },
    '/posts/:uuid': {
        'get': {
            controller: res.map('get', {resource: 'Post'}),
            scope: 'public'
        },
        'put': {
            controller: res.map('put', {resource: 'Post'}),
            scope: 'owner'
        },
        'delete': {
            controller: res.map('del', {resource: 'Post'}),
            overrideVerb: 'del',
            scope: 'owner'
        }
    },
    '/posts/:uuid/comments': {
        'get': {
            controller: res.map('find', {resource: 'Comment', query: {id_mapping: 'subject_uuid'}}),
            scope: 'public'
        }
    }
};