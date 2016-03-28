'use strict';
var mongoose = require('mongoose'),
    modelHelper = require('../lib/util/model-helper'),
    Schema = mongoose.Schema,
    ApiKey = new Schema({
        user_uuid: String,
        device_uuid: String,
        key: String,
        secret: String,
        scopes: { type: [String], default: ['user'] },
        created: Date,
        updated: Date,
        active: { type: Boolean, default: true }
    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    });

ApiKey.methods.isScopeAllowed = function (scope) {
    return this.scopes.indexOf(scope) > -1;
};

module.exports.ApiKey = modelHelper.setup(
    ApiKey,
    function (next) {
        var now = Date.now();
        this.updated = now;
        if (!this.created) {
            this.created = now;
        }
        if (typeof this.key === 'undefined' || typeof this.secret === 'undefined') {
            var secureRandom = require('secure-random'),
                sha1 = require('sha1');
            this.key = sha1(secureRandom.randomBuffer(8).toString('hex') + this.email + secureRandom.randomBuffer(8).toString('hex'));
            this.secret = secureRandom.randomBuffer(128).toString('hex');
        }
        next();
    },
    null,
    function (obj) {
        delete obj.user_uuid;
        delete obj.device_uuid;
        delete obj.active;
    }
);