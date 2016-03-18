'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Comment = new Schema({

        uuid: {type: String, unique: true},
        author_uuid: {type: String, index: true, required: true},
        subject_uuid: {type: String, index: true, required: true},
        body: {type: String, required: true},
        legacy_id: String,

        created: Date,
        updated: Date

    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    });

module.exports.Comment = require('../lib/util/model-helper').setup(Comment);