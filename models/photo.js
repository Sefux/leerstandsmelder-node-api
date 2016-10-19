'use strict';

var mongoose = require('mongoose'),
    config = require('../config.json'),
    Schema = mongoose.Schema,
    Photo = new Schema({

        uuid: {type: String, unique: true},
        location_uuid: {type: String, required: true},
        user_uuid: {type: String, index: true, required: true},
        creator_uuid: {type: String, index: true, required: true},
        publisher_uuid: {type: String, index: true, required: true},
        rights_holder_uuid: {type: String, index: true, required: true},
        filename: {type: String, required: true},
        extension: {type: String, required: true},
        mime_type: {type: String, required: true},
        filehash: {type: String, required: true},
        size: {type: Number, required: true},
        legacy_id: String,
        position: Number,

        created: Date,
        updated: Date

    }, {
        toObject: {virtuals: true},
        toJSON: {virtuals: true},
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    }),
    SwaggerSpec = {
        required: [
            'location_uuid',
            'user_uuid',
            'creator_uuid',
            'publisher_uuid',
            'rights_holder_uuid',
            'filename',
            'extension',
            'mime_type',
            'filehash',
            'size'
        ],
        properties: {
            uuid: {
                type: 'string'
            },
            original_url: {
                type: 'string'
            },
            thumb_square_url: {
                type: 'string'
            },
            thumb_large_url: {
                type: 'string'
            },
            location_uuid: {
                type: 'string'
            },
            user_uuid: {
                type: 'string'
            },
            creator_uuid: {
                type: 'string'
            },
            publisher_uuid: {
                type: 'string'
            },
            rights_holder_uuid: {
                type: 'string'
            },
            filename: {
                type: 'string'
            },
            extension: {
                type: 'string'
            },
            mime_type: {
                type: 'string'
            },
            filehash: {
                type: 'string'
            },
            size: {
                type: 'integer'
            },
            legacy_id: {
                type: 'string'
            },
            position: {
                type: 'integer'
            },
            created: {
                date: 'date'
            },
            updated: {
                date: 'date'
            }
        }
    };

Photo.virtual('original_url').get(function () {
    return `${config.file_delivery.base_url}/photos/${this.uuid}.${this.extension}`;
});

Photo.virtual('thumb_square_url').get(function () {
    return `${config.file_delivery.base_url}/thumbnails/square/200/${this.uuid}.jpg`;
});

Photo.virtual('thumb_large_url').get(function () {
    return `${config.file_delivery.base_url}/thumbnails/norm/x800/${this.uuid}.jpg`;
});

module.exports.Photo = require('../lib/util/model-helper').setup(Photo);
module.exports.SwaggerSpec = SwaggerSpec;