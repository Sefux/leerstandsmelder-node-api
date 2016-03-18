#!/usr/bin/env node

'use strict';

var Promise = require('bluebird'),
    mongoose = require('mongoose'),
    config = require('../lib/config'),
    acl = require('../lib/auth/acl-manager');

mongoose.Promise = Promise;

Promise.coroutine(function* () {
    yield config.load();
    var resources = [
            { res: 'Comment', path: '/comments', model: require('../models/comment').Comment },
            { res: 'Location', path: '/locations', model: require('../models/location').Location },
            { res: 'Photo', path: '/photos', model: require('../models/photo').Photo },
            { res: 'Post', path: '/posts', model: require('../models/post').Post }
        ],
        dburl = 'mongodb://' +
        config.get.mongodb.host + ':' +
        config.get.mongodb.port + '/' +
        config.get.mongodb.dbname;

    console.log('connecting to ' + dburl);
    return new Promise(function (resolve) {
            mongoose.connect(dburl);
            mongoose.connection.on('connected', function () {
                for (var r of resources) {
                    mongoose.model(r.res, r.model);
                }
                acl.init(mongoose.connection.db);
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
                        if (item.user_uuid || item.author_uuid) {
                            acls.push(item.user_uuid || item.author_uuid);
                        }
                        return acl.setAclEntry(resource.path + '/' + item.uuid, acls, ['get', 'put', 'post', 'delete']);
                    }, {concurrency: 1});
            }, {concurrency: 1});
        })
        .then(() => {
            console.log('done.');
            process.exit(0);
        });
})();