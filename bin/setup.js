#!/usr/bin/env node

'use strict';

var async = require('async'),
    prompt = require('prompt');

prompt.message = "";
prompt.delimiter = "";
prompt.start();

async.waterfall([
    function (cb) {
        console.log('\nWelcome to the Leerstandsmelder API Server setup.'.yellow);
        loadConfig(cb);
    },
    function (cb) {
        createAdminUser(cb);
    }
], function (err) {
    console.log('\n');
    if (err) {
        console.log('Leerstandsmelder API Server setup failed.'.red, err);
        process.exit(1);
    } else {
        console.log('Leerstandsmelder API Server setup successful.'.green);
        process.exit(0);
    }
});

function createAdminUser(callback) {
    var mongoose = require('mongoose');
    async.waterfall([
        function (cb) {
            console.log('\nCREATE ADMIN USER\n'.cyan);
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
                login: data.login,
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
    ], function (err, apikey) {
        console.log(apikey);
        callback(err);
    });
}

function loadConfig(callback) {
    var fs = require('fs'),
        path = require('path');
    fs.readFile(path.join(__dirname, '..', 'config.json'), function (err, data) {
        callback(err && err.code !== 'ENOENT' ? err : null, data ? JSON.parse(data) : null);
    });
}

function saveConfig(config, callback) {
    var fs = require('fs'),
        path = require('path');
    fs.writeFile(path.join(__dirname, '..', 'config.json'), JSON.stringify(config, null, '\t'), function (err) {
        callback(err);
    });
}
