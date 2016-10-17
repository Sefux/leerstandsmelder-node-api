#!/usr/bin/env node

"use strict";

var Promise = require('bluebird'),
    mongoose = require('mongoose'),
    config = require('../lib/config');

mongoose.Promise = Promise;

Promise.coroutine(function* () {
        yield config.load();
        if (!config.get) {
            throw new Error('Server has not been configured yet. Please run bin/setup.');
        }
        let dburl = 'mongodb://' +
            config.get.mongodb.host + ':' +
            config.get.mongodb.port + '/' +
            config.get.mongodb.dbname;
        mongoose.connect(dburl);
        mongoose.model('Location', require('../models/location').Location);

        let locations = yield mongoose.model('Location').find({active:false});

        for (let location of locations) {
            if (location.demolished !== true) {
                location.demolished = true;
                yield location.save();
                console.log('location now', location.demolished);
            }
        }

        console.log('done.');
        process.exit(0);
    })()
    .catch(function (err) {
        console.log('Error updating locations:', err.message);
        process.exit(1);
    });