'use strict';

var Promise = require('bluebird');

module.exports.paths = {};

module.exports.init = function (resourceList) {
    return Promise.map(resourceList, function (resource) {
        return Promise.map(Object.keys(resource), function (path) {
            module.exports.paths[path] = resource[path];
        });
    });
};