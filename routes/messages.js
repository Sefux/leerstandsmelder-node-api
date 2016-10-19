'use strict';

var MessagesController = require('../controllers/messages'),
    res = new MessagesController();

module.exports = {
    '/messages': {
        'post': {
            controller: res.map('post', {resource: 'Message'}),
            scope: 'user'
        }
    },
    '/messages/:uuid': {
        'get': {
            controller: res.map('get', {resource: 'Message'}),
            scope: 'user'
        },
        'delete': {
            controller: res.map('delete', {resource: 'Message', query: {user_mapping: 'user_uuid'}}),
            scope: 'owner'
        }
    }
};