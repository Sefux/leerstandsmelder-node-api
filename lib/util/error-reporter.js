'use strict';

var Promise = require('bluebird'),
    airbrake = require('airbrake'),
    client;

module.exports.init = function (credentials) {
    client = airbrake.createClient(credentials.project_id, credentials.project_key);
    client.handleExceptions();
};

module.exports.notify = function (err) {
    return Promise.promisify(function (err, cb) {
        client.notify(err, cb);
    })(err);
};