'use strict';

var _dbi, _acl, _self,
    Promise = require('bluebird'),
    acl = require('acl');

module.exports.init = function (db) {
    _self = this;
    _dbi = db;
    _acl = new acl(new acl.mongodbBackend(db, 'acl_'));
};

module.exports.setAclEntry = (resource, user, action) => {
    return Promise.promisify(function (resource, user, action, cb) {
        _acl.allow(user, resource, action, function (err) {
            cb(err);
        });
    })(resource, user, action);
};

module.exports.removeAclEntry = (resource, user, action) => {
    return Promise.promisify(function (resource, user, action, cb) {
        _acl.removeAllow(user, resource, action, function (err) {
            cb(err);
        });
    })(resource, user, action);
};

module.exports.isAllowed = (resource, user, action) => {
    return Promise.promisify(function (resource, user, action, cb) {
        _acl.isAllowed(user, resource, action, function (err, allowed) {
            cb(err, allowed);
        });
    })(resource, user, action);
};

module.exports.addUserRole = (user_uuid, role) => {
    _acl.addUserRoles(user_uuid, role);
};