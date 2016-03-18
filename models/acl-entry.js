'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    AclEntry = new Schema({

        resource_key: {type: String, index: true, required: true},
        role_key: {type: [String], index: true, required: true},
        actions: [String]

    }, {
        autoindex: process.env.NODE_ENV !== 'production',
        id: false
    });

module.exports.AclEntry = require('../lib/util/model-helper').setup(AclEntry);