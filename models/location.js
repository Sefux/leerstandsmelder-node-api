'use strict';

var mongoose = require('mongoose'),
    slug = require('speakingurl'),
    Schema = mongoose.Schema,
    Location = new Schema({

        uuid: {type: String, unique: true},
        user_uuid: {type: String, index: true, required: true},

        title: {type: String, required: true, index: true},
        description: String,
        degree: String,
        owner: {type: String, index: true},
        demolition_rumor: {type:Boolean, default: false},
        emptySince: String,
        buildingType: String,
        street: {type: String, index: true},
        city: {type: String, index: true},
        postcode: {type: String, index: true},
        // TODO: should this be required?
        lonlat: {
            type: [Number],  // [<longitude>, <latitude>]
            index: '2dsphere'
        },
        region_uuid: {type:String, required: true, index: true},
        active: {type: Boolean, default: true},
        demolished: {type:Boolean, default: false},
        slug: {type:String, index: true},
        slug_aliases: [String],
        legacy_id: String,
        legacy_slug: String,
        hidden: {type: Boolean, default: false},

        created: Date,
        updated: Date

    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    }),
    SwaggerSpec = {
        required: [
            'user_uuid',
            'title',
            'region_uuid'
        ],
        properties: {
            uuid: {
                type: 'string'
            },
            user_uuid: {
                type: 'string'
            },
            title: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            degree: {
                type: 'string'
            },
            owner: {
                type: 'string'
            },
            demolition_rumor: {
                type: 'boolean',
                defaultValue: false
            },
            emptySince: {
                type: 'string'
            },
            buildingType: {
                type: 'string'
            },
            street: {
                type: 'string'
            },
            city: {
                type: 'string'
            },
            postcode: {
                type: 'string'
            },
            lonlat: {
                type: 'array',
                items: {
                    type: 'float'
                }
            },
            region_uuid: {
                type: 'string'
            },
            active: {
                type: 'boolean',
                defaultValue: true
            },
            demolished: {
                type: 'boolean',
                defaultValue: false
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
            hidden: {
                type: 'boolean',
                defaultValue: false
            },
            created: {
                type: 'date'
            },
            updated: {
                type: 'date'
            }
        }
    };

Location.methods.updateSlug = function () {
    this.slug = slug(this.title + ' ' + this.uuid.substr(0,5));
};

module.exports.Location = require('../lib/util/model-helper').setup(
    Location,
    function (next) {
        var now = Date.now();
        this.updated = now;
        if (!this.created) {
            this.created = now;
        }
        if (!this.uuid) {
            this.generateUUID();
        }
        if (this.modifiedPaths().indexOf('title') > -1) {
            this.updateSlug();
            next();
        } else {
            next();
        }
    }
);
module.exports.SwaggerSpec = SwaggerSpec;