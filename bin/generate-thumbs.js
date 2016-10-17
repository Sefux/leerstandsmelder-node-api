#!/usr/bin/env node

'use strict';

var Promise = require('bluebird'),
    mongoose = require('mongoose'),
    config = require('../lib/config'),
    gm = require('gm'),
    path = require('path');

mongoose.Promise = Promise;

Promise.coroutine(function* () {
    yield config.load();
    var dburl = 'mongodb://' +
            config.get.mongodb.host + ':' +
            config.get.mongodb.port + '/' +
            config.get.mongodb.dbname;

    mongoose.connect(dburl);
    mongoose.model('Photo', require('../models/photo').Photo);

    console.log('connecting to ' + dburl);

    return Promise.resolve(mongoose.model('Photo').find({}))
        .map(function (photo) {
            return Promise.promisify(function (cb) {
                    gm(path.resolve('../assets/photos/' + photo.uuid))
                        .resize('200', '200', '^>')
                        .gravity('Center')
                        .crop('200', '200')
                        .write(path.resolve('../assets/photos/' + photo.uuid + '-thumb'), function (err) {
                            cb(err);
                        });
                })()
                .catch(function (err) {
                    console.log(err.message);
                });
        }, {concurrency: 1});
})();