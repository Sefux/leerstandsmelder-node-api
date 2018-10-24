#!/usr/bin/env node

"use strict";

var Promise = require('bluebird'),
    mongoose = require('mongoose'),
    config = require('../config.json');

mongoose.Promise = Promise;

Promise.coroutine(function* () {
    yield config.load();
    if (!config) {
        throw new Error('Server has not been configured yet. Please run bin/setup.');
    }
    let dburl = 'mongodb://' +
        config.mongodb.host + ':' +
        config.mongodb.port + '/' +
        config.mongodb.dbname;
    mongoose.connect(dburl);

    let argv = require('yargs')
        .string('slug')
        .string('title')
        .argv;

    mongoose.model('Region', require('../models/region').Region);
    var region = {
        slug: argv.slug,
        title: argv.title
    };

    mongoose.model('Region').create(region, function(err) {
        if(err) {
            console.log('Region not created', err );
        } else {
            console.log('Region "' + argv.title +'" created');
            process.exit(0);
        }

    });

})()
.catch(function (err) {
    console.log('Error adding region:', err.message);
    process.exit(1);
});
