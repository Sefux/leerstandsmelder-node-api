'use strict';

var mongoose = require('mongoose'),
    slug = require('speakingurl'),
    Schema = mongoose.Schema,
    Region = new Schema({

        uuid: {type: String, unique: true},

        title: {type: String, required: true},
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
    });

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