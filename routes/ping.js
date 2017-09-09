'use strict';

var swagger = require('swagger-node-restify'),
    access_tokens = require('../controllers/access-tokens'),
    PingController = require('../controllers/ping'),
    ping = new PingController();

module.exports = {
    '/ping': {
        'get': {
            controller: ping.map('get'),
            scope: 'public',
            spec: {
                path: '/ping',
                description: 'Get a ping from the server',
                summary: 'Ping server',
                nickname: 'pingServer'
            }
        }
    }
}
