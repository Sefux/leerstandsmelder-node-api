'use strict';

var mongoose = require('mongoose'),
    striptags = require('striptags'),
    Schema = mongoose.Schema,
    Post = new Schema({

        uuid: {type: String, unique: true},
        title: {type: String, required: true},
        body: {type: String, required: true},
        legacy_id: String,

        created: Date,
        updated: Date

    }, {
        toObject: {virtuals: true},
        toJSON: {virtuals: true},
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    });

Post.virtual('abstract').get(function () {
    return striptags(this.body).substring(0, 400);
});

module.exports.Post = require('../lib/util/model-helper').setup(Post);