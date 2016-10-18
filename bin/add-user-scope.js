#!/usr/bin/env node

"use strict";

var Promise = require('bluebird'),
    mongoose = require('mongoose'),
    config = require('../config.json');

mongoose.Promise = Promise;

Promise.coroutine(function* () {
    if (!config) {
        throw new Error('Server has not been configured yet. Please run bin/setup.');
    }
    let dburl = 'mongodb://' +
        config.mongodb.host + ':' +
        config.mongodb.port + '/' +
        config.mongodb.dbname;
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
        } else {
            console.log('No update of User necessary, has scope ' + argv.scope);
        }
        yield user.save();
        console.log('Updated User scope.');
        let api_key = yield mongoose.model('ApiKey')
            .findOne({user_uuid: user.uuid, active: true})
            .sort('-created').exec();
        if (api_key) {
            if (api_key.scopes.indexOf(argv.scope) === -1) {
                api_key.scopes.push(argv.scope);
                yield api_key.save();
                console.log('Scope ' + argv.scope + ' added to ApiKey.');
                process.exit(0);
            } else {
                console.log('No update of ApiKey necessary, has scope ' + argv.scope);
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