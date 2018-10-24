#!/usr/bin/env node

'use strict';

var async = require('async'),
    prompt = require('prompt');

prompt.message = "";
prompt.delimiter = "";
prompt.start();

async.waterfall([
    function (cb) {
        console.log('\nWelcome to the MAP-OZ API Server setup.');
        loadConfig(cb);
    },
    function (cb) {
        createAdminUser(cb);
    }
], function (err) {
    console.log('\n');
    if (err) {
        console.log('MAP-OZ API Server setup failed.', err);
        process.exit(1);
    } else {
        console.log('MAP-OZ API Server setup successful.');
        process.exit(0);
    }
});

function createAdminUser(cb) {
    var mongoose = require('mongoose');
    async.waterfall([
        function (cb) {
            console.log('\nCREATE ADMIN USER\n');
            prompt.get({
                properties: {
                    login: {
                        description: 'Login',
                        type: 'string',
                        default: 'Admin',
                        required: true
                    },
                    email: {
                        description: 'EMail',
                        type: 'string',
                        required: true
                    },
                    password: {
                        description: 'Password',
                        type: 'string',
                        required: true,
                        hidden: true
                    },
                    password_confirm: {
                        description: 'Repeat password',
                        type: 'string',
                        required: true,
                        hidden: true
                    }
                }
            }, cb);
        },
        function (data, cb) {
            loadConfig(function (err, config) {
                cb(err, data, config);
            });
        },
        function (data, config, cb) {
            mongoose.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.dbname);
            mongoose.model('User', require('../models/user').User);
            var user = {
                nickname: data.login,
                email: data.email,
                password: data.password,
                confirmed: true
            };
            console.log(user);
            mongoose.model('User').create(user, cb);
        },
        function (user, cb) {
            console.log(user);
            mongoose.model('ApiKey', require('../models/api-key').ApiKey);
            mongoose.model('ApiKey').create({user_uuid: user.uuid, scopes: ['user', 'admin']}, cb);
        }
    ], function (err, apikey, cb) {
        console.log('apikey',apikey);
        console.log('err',err);

        cb();
    });
}

function loadConfig(callback) {
    var fs = require('fs'),
        path = require('path');
    fs.readFile(path.join(__dirname, '..', 'config.json'), function (err, data) {
        console.log('load config');
        callback(err && err.code !== 'ENOENT' ? err : null, data ? JSON.parse(data) : null);
    });
}
