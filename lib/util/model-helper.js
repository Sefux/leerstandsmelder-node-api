'use strict';
module.exports.setup = function (schema, preSaveFunc, preUpdateFunc, addFilterParams) {

    function filterParams(obj) {
        delete obj.__v;
        delete obj._id;
        if (typeof addFilterParams === 'function') addFilterParams(obj);
    }

    if (typeof schema.options.toJSON === 'undefined') {
        schema.options.toJSON = {};
    }

    schema.options.toJSON.transform = function (doc, ret) {
        filterParams(ret);
    };

    if (typeof schema.options.toObject === 'undefined') {
        schema.options.toObject = {};
    }

    schema.options.toObject.transform = function (doc, ret) {
        filterParams(ret);
    };

    schema.methods.generateUUID = function () {
        var uuid = require('./uuid');
        var val = uuid.v4();
        this.uuid = val;
    };

    if (typeof preSaveFunc === 'function') {
        schema.pre('save', preSaveFunc);
    } else {
        schema.pre('save', function (next) {
            var now = Date.now(),
                sanitizer = require('sanitizer');
            if (typeof this.title !== 'undefined') {
                this.title = sanitizer.sanitize(this.title);
            }
            if (typeof this.description !== 'undefined') {
                this.description = sanitizer.sanitize(this.description);
            }
            this.updated = now;
            if (!this.created) {
                this.created = now;
            }
            if (!this.uuid) {
                this.generateUUID();
            }
            next();
        });
    }

    if (typeof preUpdateFunc === 'function') {
        schema.pre('update', preUpdateFunc);
    } else {
        schema.pre('update', function (next) {
            if (this.updated) {
                this.updated = Date.now();
            }
            next();
        });
    }

    return schema;
};
