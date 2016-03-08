'use strict';

var CommonController = require('../controllers/common'),
    res = new CommonController();

module.exports = {
    '/comments': {
        'post': {
            controller: res.map('post', {resource: 'Comment'}),
            scope: 'user'
        }
    },
    '/comments/:uuid': {
        'get': {
            controller: res.map('get', {resource: 'Comment'}),
            scope: 'public'
        },
        'put': {
            controller: res.map('put', {resource: 'Comment'}),
            scope: 'owner'
        },
        'delete': {
            controller: res.map('del', {resource: 'Comment'}),
            overrideVerb: 'del',
            scope: 'owner'
        }
    },
    '/comments/:uuid/comments': {
        'get': {
            controller: res.map('find', {resource: 'Comment', query: {id_mapping: 'subject_uuid'}}),
            scope: 'public'
        }
    }
};