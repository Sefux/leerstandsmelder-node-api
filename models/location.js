'use strict';

var mongoose = require('mongoose'),
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
        legacy_id: String,

        created: Date,
        updated: Date

    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    });

module.exports.Location = require('../lib/util/model-helper').setup(Location);