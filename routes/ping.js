'use strict';

var PingController = require('../controllers/ping'),
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
};
