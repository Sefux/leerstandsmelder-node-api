#!/usr/bin/env node

'use strict';

var Promise = require('bluebird'),
    mongoose = require('mongoose'),
    config = require('../lib/config'),
    acl = require('../lib/auth/acl-manager');

Promise.coroutine(function* () {
    yield config.load();
    var resources = [
            {res: 'Location', path: '/locations', model: require('../models/location').Location},
            {res: 'Post', path: '/posts', model: require('../models/post').Post}
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
                console.log('Updating slugs for ' + resource.res);
                return Promise.resolve()
                    .then(() => {
                        return mongoose.model(resource.res).find({});
                    })
                    .map((item) => {
                        item.updateSlug();
                        console.log('new slug:', item.slug);
                        return item.save();
                    }, {concurrency: 1});
            }, {concurrency: 1});
        })
        .then(() => {
            console.log('done.');
            process.exit(0);
        });
})();