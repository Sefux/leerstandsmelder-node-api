#!/usr/bin/env node

"use strict";

const Promise = require('bluebird'),
    mongoose = require('mongoose'),
    config = require('../lib/config');

mongoose.Promise = Promise;

Promise.coroutine(function*() {
    yield config.load();
    if (!config.get) {
        throw new Error('Server has not been configured yet. Please run bin/setup.');
    }
    let dburl = 'mongodb://' +
        config.get.mongodb.host + ':' +
        config.get.mongodb.port + '/' +
        config.get.mongodb.dbname;
    mongoose.connect(dburl);
    mongoose.model('Region', require('../models/region').Region);

    let argv = require('yargs')
        .string('title')
        .string('slug')
        .string('lat')
        .string('lon')
        .argv;

    let region = yield mongoose.model('Region').findOne({slug: argv.slug});
    if (!region) {
        region = yield mongoose.model('Region').create({
            slug: argv.slug,
            title: argv.title,
            lonlat: [parseFloat(argv.lon), parseFloat(argv.lat)]
        });
        console.log('Created region with UUID', region.uuid);
        process.exit(0);
    } else {
        console.log('Region exists.');
        process.exit(1);
    }
})()
.catch(function (err) {
    console.log('Error creating region:', err.message);
    process.exit(1);
});