'use strict';

var mongoose = require('mongoose'),
    striptags = require('striptags'),
    slug = require('speakingurl'),
    Schema = mongoose.Schema,
    Post = new Schema({

        uuid: {type: String, unique: true},
        title: {type: String, required: true},
        body: {type: String, required: true},
        static: {type: Boolean, default: false},
        slug: {type:String, index: true},
        slug_aliases: [String],
        legacy_id: String,
        legacy_slug: String,

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
            'title',
            'body'
        ],
        properties: {
            uuid: {
                type: 'string'
            },
            title: {
                type: 'string'
            },
            body: {
                type: 'string'
            },
            static: {
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
            created: {
                type: 'date'
            },
            updated: {
                type: 'date'
            }
        }
    };

Post.virtual('abstract').get(function () {
    return striptags(this.body).replace(/\[|\]\(.*\)/g, '').substring(0, 400);
});

Post.methods.updateSlug = function () {
    this.slug = slug(this.title);
};

module.exports.Post = require('../lib/util/model-helper').setup(
    Post,
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