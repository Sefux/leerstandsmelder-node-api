'use strict';

var mongoose = require('mongoose'),
    slug = require('speakingurl'),
    Schema = mongoose.Schema,
    Region = new Schema({

        uuid: {type: String, unique: true},

        title: {type: String, required: true},
        // TODO: should this be required?
        lonlat: {
            type: [Number],  // [<longitude>, <latitude>]
            index: '2dsphere'
        },
        zoom: {type:Number, default: 14},
        moderate: {type:Boolean, default: false},
        hide: {type:Boolean, default: false},
        hide_message: String,
        slug: {type: String, index: true},
        slug_aliases: [String],
        legacy_id: String,
        legacy_slug: String,

        created: Date,
        updated: Date

    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    }),
    SwaggerSpec = {
        required: [
            'title'
        ],
        properties: {
            uuid: {
                type: 'string'
            },
            title: {
                type: 'string'
            },
            lonlat: {
                type: 'array',
                items: {
                    type: 'float'
                }
            },
            zoom: {
                type: 'integer',
                defaultValue: 14
            },
            moderate: {
                type: 'boolean',
                defaultValue: false
            },
            hide: {
                type: 'boolean',
                defaultValue: false
            },
            hide_message: {
                type: 'string'
            },
            slug: {
                type: 'string'
            },
            slug_aliases: {
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            legacy_id: {
                type: 'string'
            },
            legacy_slug: {
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

Region.virtual('num_locations').get(function () {
    return mongoose.model('Location').count({region_uuid: this.uuid});
});

Region.methods.updateSlug = function () {
    this.slug = slug(this.title);
};

module.exports.Region = require('../lib/util/model-helper').setup(
    Region,
    function (next) {
        var now = Date.now();
        this.updated = now;
        if (!this.created) {
            this.created = now;
        }
        if (!this.uuid) {
            this.generateUUID();
        }
        this.updateSlug();
        next();
    }
);
module.exports.SwaggerSpec = SwaggerSpec;