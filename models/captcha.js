'use strict';

var mongoose = require('mongoose'),
    Promise = require('bluebird'),
    Schema = mongoose.Schema,
    Captcha = new Schema({

        code: {type: Number, unique: true},
        created: Date

    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    });

// TODO: needs a background job purging expired captchas
Captcha.methods.purgeIfExpired = function () {
    if (new Date().getTime() - new Date(this.created).getTime() > 3600 * 1000) {
        return Promise.resolve(this.remove());
    }
};

module.exports.Captcha = require('../lib/util/model-helper').setup(
    Captcha,
    function (next) {
        var now = Date.now();
        if (!this.created) {
            this.created = now;
        }
        if (!this.code) {
            this.code = parseInt(Math.random() * 99000 + 1000);
        }
        next();
    }
);