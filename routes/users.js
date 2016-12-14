'use strict';

var swagger = require('swagger-node-restify'),
    access_tokens = require('../controllers/access-tokens'),
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
            scope: 'public',
            spec: {
                path: '/users',
                description: 'Add a new User',
                summary: 'Create User',
                params: [
                    swagger.bodyParam('User', 'A User object', 'User')
                ],
                errorResponses: [
                    swagger.errors.invalid('User')
                ],
                nickname: 'createUser',
                responseClass: 'User'
            }
        },
        'get': {
            controller: users.map('find', {resource: 'User'}),
            scope: 'admin',
            spec: {
                path: '/users',
                description: 'Get list of Users',
                summary: 'Find Users',
                nickname: 'findUsers',
                responseClass: 'User'
            }
        }
    },
    '/users/:uuid': {
        'get': {
            controller: users.map('get', {resource: 'User'}),
            scope: 'public',
            spec: {
                path: '/users/{uuid}',
                description: 'Get a user',
                summary: 'Get User',
                params: [swagger.pathParam('uuid', 'UUID of the user', 'string')],
                errorResponses: [swagger.errors.notFound('User')],
                nickname: 'getUser',
                responseClass: 'User'
            }
        },
        'put': {
            controller: users.map('put', {resource: 'User'}),
            scope: 'owner',
            spec: {
                path: '/users/{uuid}',
                description: 'Update a user',
                summary: 'Update User',
                params: [
                    swagger.pathParam('uuid', 'UUID of the user', 'string'),
                    swagger.bodyParam('Region', 'A User object', 'Region')
                ],
                errorResponses: [swagger.errors.notFound('User')],
                nickname: 'updateUser',
                responseClass: 'User'
            }
        },
        'delete': {
            controller: users.map('delete', {resource: 'User'}),
            scope: 'admin',
            spec: {
                path: '/users/{uuid}',
                description: 'Delete a user',
                summary: 'Delete User',
                params: [swagger.pathParam('uuid', 'UUID of the user', 'string')],
                errorResponses: [swagger.errors.notFound('User')],
                nickname: 'deleteUser'
            }
        }
    },
    '/users/me/access_tokens': {
        'post': {
            controller: access_tokens.post,
            scope: 'public',
            spec: {
                path: '/users/me/access_tokens',
                description: 'Request an AccessToken',
                summary: 'Request AccessToken',
                params: [
                    swagger.bodyParam('email', 'A registered email address', 'string'),
                    swagger.bodyParam('password', 'The associated password', 'string')
                ],
                errorResponses: [swagger.errors.forbidden()],
                nickname: 'requestAccessToken',
                responseClass: 'AccessToken'
            }
        }
    },
    '/users/me/api_keys': {
        'get': {
            controller: res.map('find', {resource: 'ApiKey', query: {user_mapping: 'user_uuid'}}),
            scope: 'user',
            spec: {
                path: '/users/me/api_keys',
                description: 'Get ApiKeys for current user.',
                summary: 'Get My ApiKeys',
                errorResponses: [swagger.errors.forbidden()],
                nickname: 'getMyApiKeys',
                responseClass: 'List[ApiKey]'
            }
        }
    },
    '/users/me/locations': {
        'get': {
            controller: locations.map('find', {resource: 'Location', query: {user_mapping: 'user_uuid'}}),
            scope: 'user',
            spec: {
                path: '/users/me/locations',
                description: 'Get Locations for current user.',
                summary: 'Get My Locations',
                errorResponses: [swagger.errors.forbidden()],
                nickname: 'getMyLocations',
                responseClass: 'List[Location]'
            }
        }
    },
    '/users/me/messages': {
        'get': {
            controller: messages.map('find', {resource: 'Message'}),
            scope: 'user',
            spec: {
                path: '/users/me/messages',
                description: 'Get Messages for current user.',
                summary: 'Get My Messages',
                errorResponses: [swagger.errors.forbidden()],
                nickname: 'getMyMessages',
                responseClass: 'List[Message]'
            }
        }
    },
    '/users/me/reset': {
        'post': {
            controller: users.map('resetUser'),
            scope: 'public',
            spec: {
                path: '/users/me/reset',
                description: 'Request a password reset email.',
                summary: 'Request Password Reset',
                notes: 'To prevent probing of emails there is no error response no matter if the email exists or not.',
                params: [
                    swagger.bodyParam('email', 'A registered email address', 'string')
                ],
                nickname: 'requestPasswordReset'
            }
        }
    }
};