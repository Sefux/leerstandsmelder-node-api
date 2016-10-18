#!/usr/bin/env node

'use strict';

var Promise = require('bluebird'),
    mongoose = require('mongoose'),
    config = require('../config.json'),
    acl = require('../lib/auth/acl-manager');

mongoose.Promise = Promise;

Promise.coroutine(function* () {
    var resources = [
            {res: 'Comment', path: '/comments', model: require('../models/comment').Comment},
            {res: 'Location', path: '/locations', model: require('../models/location').Location},
            {res: 'Region', path: '/regions', model: require('../models/region').Region},
            {res: 'Photo', path: '/photos', model: require('../models/photo').Photo},
            {res: 'Post', path: '/posts', model: require('../models/post').Post},
            {res: 'User', path: '/users', model: require('../models/user').User}
        ],
        dburl = 'mongodb://' +
        config.mongodb.host + ':' +
        config.mongodb.port + '/' +
        config.mongodb.dbname;

    console.log('connecting to ' + dburl);
    return new Promise(function (resolve) {
            mongoose.connect(dburl);
            mongoose.connection.on('connected', function () {
                for (var r of resources) {
                    mongoose.model(r.res, r.model);
                }
                mongoose.model('AclEntry', require('../models/acl-entry').AclEntry);
                console.log('connected to mongodb!');
                resolve();
            });
        })
        .then(() => {
            return Promise.map(resources, (resource) => {
                console.log('Setting ACLs for ' + resource.res);
                return mongoose.model(resource.res).find({})
                    .then((results) => {
                        return results;
                    })
                    .map((item) => {
                        var acls = ['admin'];
                        if (item.user_uuid) {
                            acls.push(item.user_uuid);
                        }
                        if (resource.res === 'Post') {
                            acls.push('editor');
                        }
                        if (resource.res === 'Location') {
                            acls.push('region-' + item.region_uuid);
                        }
                        if (resource.res === 'User') {
                            acls.push(item.uuid);
                            return acl.setAclEntry('/users/me', acls, ['get', 'put', 'delete'])
                                .then(function () {
                                    return acl.setAclEntry('/users/' + item.uuid, ['user'], ['get']);
                                });
                        } else {
                            return acl.setAclEntry(resource.path + '/' + item.uuid, acls, ['get', 'put', 'delete']);
                        }
                    }, {concurrency: 1});
            }, {concurrency: 1});
        })
        .then(() => {
            console.log('done.');
            process.exit(0);
        });
})();