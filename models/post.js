'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Post = new Schema({

        uuid: {type: String, unique: true},
        title: {type: String, required: true},
        body: {type: String, required: true},
        legacy_id: String,

        created: Date,
        updated: Date

    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    });

module.exports.Post = require('../lib/util/model-helper').setup(Post);