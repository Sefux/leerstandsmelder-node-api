'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Message = new Schema({

        uuid: {type: String, unique: true},
        user_uuid: {type: String, required: true},
        recipient_uuid: {type: String, required: true},
        subject_uuid: String,
        body: {type: String, required: true},

        created: Date

    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    });

module.exports.Message = require('../lib/util/model-helper').setup(Message);