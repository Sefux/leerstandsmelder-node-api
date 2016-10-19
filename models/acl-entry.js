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
    }),
    // TODO: add enum type to actions
    SwaggerSpec = {
        required: [
            'resource_key',
            'role_key'
            ],
        properties: {
            resource_key: {
                type: 'string'
            },
            role_key: {
                type: 'string'
            },
            actions: {
                type: 'array',
                items: {
                    type: 'string'
                }
            }
        }
    };

module.exports.AclEntry = require('../lib/util/model-helper').setup(AclEntry);
module.exports.SwaggerSpec = SwaggerSpec;