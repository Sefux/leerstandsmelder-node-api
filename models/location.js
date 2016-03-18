'use strict';

var mongoose = require('mongoose'),
    slug = require('speakingurl'),
    Schema = mongoose.Schema,
    Location = new Schema({

        uuid: {type: String, unique: true},
        user_uuid: {type: String, index: true, required: true},

        title: {type: String, required: true},
        description: String,
        degree: String,
        owner: String,
        rumor: Number,
        emptySince: Date,
        buildingType: String,
        street: String,
        city: String,
        postcode: String,
        lonlat: {
            type: [Number],  // [<longitude>, <latitude>]
            index: '2d'
        },
        active: {type: Boolean, default: true},
        slug: {type:String, index: true},
        slug_aliases: [String],
        legacy_id: String,
        legacy_slug: String,

        created: Date,
        updated: Date

    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    });

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