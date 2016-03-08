'use strict';
var mongoose = require('mongoose'),
    modelHelper = require('../lib/util/model-helper'),
    Schema = mongoose.Schema,
    AccessToken = new Schema({
        api_key: { type: String, index: true, required: true },
        token: String,
        scopes: { type: [String], default: ['user'] },
        issued: Date,
        hours_valid: { type: Number, default: 1440 }
    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    });

AccessToken.methods.isValid = function () {
    var expiration = new Date();
    expiration.setHours(expiration.getHours() + this.hours_valid);
    return this.issued < expiration;
};

module.exports.AccessToken = modelHelper.setup(
    AccessToken,
    function (next) {
        this.issued = Date.now();
        if (typeof this.token === 'undefined' || this.access_token_expires < Date.now()) {
            var secureRandom = require('secure-random');
            this.token = secureRandom.randomBuffer(128).toString('hex');
        }
        next();
    },
    null,
    function (obj) {
        delete obj.api_key;
        delete obj.scopes;
    }
);