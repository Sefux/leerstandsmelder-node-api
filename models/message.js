'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Message = new Schema({

        uuid: {type: String, unique: true},
        user_uuid: {type: String, required: true},
        recipient_uuid: String,
        subject_uuid: String,
        body: {type: String, required: true},

        created: Date,
        read: Date

    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    }),
    SwaggerSpec = {
        required: [
            'user_uuid',
            'recipient_uuid',
            'body'
        ],
        properties: {
            uuid: {
                type: 'string'
            },
            user_uuid: {
                type: 'string'
            },
            recipient_uuid: {
                type: 'string'
            },
            subject_uuid: {
                type: 'string'
            },
            body: {
                type: 'string'
            },
            created: {
                date: 'date'
            }
        }
    };

module.exports.Message = require('../lib/util/model-helper').setup(Message);
module.exports.SwaggerSpec = SwaggerSpec;