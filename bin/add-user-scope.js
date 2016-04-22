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
    mongoose.model('ApiKey', require('../models/api-key').ApiKey);

    let argv = require('yargs')
        .string('email')
        .string('scope')
        .argv;

    let user = yield mongoose.model('User').findOne({ email: argv.email });
    if (user) {
        if (user.scopes.indexOf(argv.scope) === -1) {
            user.scopes.push(argv.scope);
        }
        yield user.save();
        let api_key = yield mongoose.model('ApiKey')
            .findOne({user_uuid: user.uuid, active: true})
            .sort('-created').exec();
        if (api_key) {
            if (api_key.scopes.indexOf(argv.scope) === -1) {
                api_key.scopes.push(argv.scope);
                yield api_key.save();
                console.log('Scope ' + argv.scope + ' added to user.');
                process.exit(0);
            } else {
                console.log('No update necessary, user has scope ' + argv.scope);
                process.exit(0);
            }
            process.exit(0);
        } else {
            console.log('No active ApiKey found.');
            process.exit(1);
        }
    } else {
        console.log('User not found.');
        process.exit(1);
    }
})()
.catch(function (err) {
    console.log('Error updating user:', err.message);
    process.exit(1);
});