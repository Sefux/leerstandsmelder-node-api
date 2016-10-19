'use strict';

var access_tokens = require('../controllers/access-tokens'),
    CommonController = require('../controllers/common'),
    UsersController = require('../controllers/users'),
    LocationsController = require('../controllers/locations'),
    MessagesController = require('../controllers/messages'),
    res = new CommonController(),
    users = new UsersController(),
    locations = new LocationsController(),
    messages = new MessagesController();

module.exports = {
    '/users': {
        'post': {
            controller: users.map('post', {resource: 'User'}),
            scope: 'public'
        }
    },
    '/users/:uuid': {
        'get': {
            controller: users.map('get', {resource: 'User'}),
            scope: 'public'
        },
        'put': {
            controller: users.map('put', {resource: 'User'}),
            scope: 'owner'
        },
        'delete': {
            controller: users.map('delete', {resource: 'User'}),
            scope: 'admin'
        }
    },
    '/users/me/access_tokens': {
        'post': {
            controller: access_tokens.post,
            scope: 'public'
        }
    },
    '/users/me/api_keys': {
        'get': {
            controller: res.map('find', {resource: 'ApiKey', query: {user_mapping: 'user_uuid'}}),
            scope: 'user'
        }
    },
    '/users/me/challenge': {
        'get': {
            controller: res.map('find', {resource: 'Challenge', query: {user_mapping: 'user_uuid'}}),
            scope: 'user'
        }
    },
    '/users/me/locations': {
        'get': {
            controller: locations.map('find', {resource: 'Location', query: {user_mapping: 'user_uuid'}}),
            scope: 'user'
        }
    },
    '/users/me/messages': {
        'get': {
            controller: messages.map('find', {resource: 'Message'}),
            scope: 'user'
        }
    },
    '/users/me/reset': {
        'post': {
            controller: users.map('resetUser'),
            scope: 'public'
        }
    }
};