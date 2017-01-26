'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Comment = new Schema({

        uuid: {type: String, unique: true},
        user_uuid: {type: String, index: true, required: true},
        subject_uuid: {type: String, index: true, required: true},
        body: {type: String, required: true},
        hidden: {type: Boolean, default: false},
        legacy_id: String,

        created: Date,
        updated: Date

    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    }),
    SwaggerSpec = {
        required: [
            'user_uuid',
            'subject_uuid',
            'body'
        ],
        properties: {
            uuid: {
                type: 'string'
            },
            user_uuid: {
                type: 'string'
            },
            subject_uuid: {
                type: 'string'
            },
            body: {
                type: 'string'
            },
            legacy_id: {
                type: 'string'
            },
            created: {
                type: 'date'
            },
            updated: {
                type: 'date'
            }
        }
    };

module.exports.Comment = require('../lib/util/model-helper').setup(Comment);
module.exports.SwaggerSpec = SwaggerSpec;