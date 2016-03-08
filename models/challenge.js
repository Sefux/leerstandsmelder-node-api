'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Challenge = new Schema({

        user_uuid: {type: String, required: true},
        challenge: {type: String, required: true},
        response: {type: String, required: true},

    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    });

module.exports.Challenge = require('../lib/util/model-helper').setup(Challenge);