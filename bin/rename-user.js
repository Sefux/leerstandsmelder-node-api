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
    mongoose.model('User', require('../models/user').User);

    let argv = require('yargs')
        .string('email')
        .string('nickname')
        .argv;

    let user = yield mongoose.model('User').findOne({ email: argv.email });
    if (user) {
        user.nickname = argv.nickname;
        yield user.save();
        console.log('Updated User nickname.');
        process.exit(0);
    } else {
        console.log('User not found.');
        process.exit(1);
    }
})()
.catch(function (err) {
    console.log('Error updating user:', err.message);
    process.exit(1);
});