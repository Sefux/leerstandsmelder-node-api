'use strict';

var swagger = require('swagger-node-restify'),
    MessagesController = require('../controllers/messages'),
    res = new MessagesController();

module.exports = {
    '/messages': {
        'post': {
            controller: res.map('post', {resource: 'Message'}),
            scope: 'user',
            spec: {
                path: '/messages',
                description: 'Add a new Message',
                summary: 'Create Message',
                params: [
                    swagger.bodyParam('Message', 'A Message object', 'Message')
                ],
                errorResponses: [
                    swagger.errors.invalid('Message')
                ],
                nickname: 'createMessage',
                responseClass: 'Message'
            }
        }
    },
    '/messages/:uuid': {
        'get': {
            controller: res.map('get', {resource: 'Message'}),
            scope: 'user',
            spec: {
                path: '/messages/{uuid}',
                description: 'Get a message',
                summary: 'Get Message',
                params: [swagger.pathParam('uuid', 'UUID of the message', 'string')],
                errorResponses: [swagger.errors.notFound('Message')],
                nickname: 'getMessage',
                responseClass: 'Message'
            }
        },
        'delete': {
            controller: res.map('delete', {resource: 'Message', query: {user_mapping: 'user_uuid'}}),
            scope: 'owner',
            spec: {
                path: '/messages/{uuid}',
                description: 'Delete a message',
                summary: 'Delete Message',
                params: [swagger.pathParam('uuid', 'UUID of the message', 'string')],
                errorResponses: [swagger.errors.notFound('Message')],
                nickname: 'deleteMessage'
            }
        }
    }
};