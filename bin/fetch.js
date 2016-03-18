#!/usr/bin/env node

'use strict';

var Promise = require('bluebird'),
    request = require('request'),
    mongoose = require('mongoose'),
    path = require('path'),
    fs = require('fs-extra'),
    checksum = require('checksum'),
    config = require('../lib/config'),
    fetchedItems = 0,
    downloadImageAsync = Promise.promisify(downloadImage),
    fsExists = Promise.promisify(function fsExists(src, cb) {
        fs.exists(src, function (exists) {
            cb(null, exists);
        });
    });

mongoose.Promise = Promise;

Promise.promisifyAll(fs);
Promise.promisifyAll(checksum);

Promise.resolve()
    .then(function () {
        return config.load();
    })
    .then(function () {
        if (!config.get) {
            throw new Error('Server has not been configured yet. Please run bin/setup.');
        }
        var dburl = 'mongodb://' +
            config.get.mongodb.host + ':' +
            config.get.mongodb.port + '/' +
            config.get.mongodb.dbname;
        mongoose.connect(dburl);
        mongoose.model('Photo', require('../models/photo').Photo);
        return fs.mkdirpAsync(path.join('..', 'assets', 'photos'));
    })
    .then(function () {
        return mongoose.model('Photo').find({});
    })
    .map(function (photo) {
        var url = 'http://www.leerstandsmelder.de/system/photos/' + photo.legacy_id + '/original/' + photo.filename + '.' + photo.extension,
            destPath = path.resolve('../assets/photos/' + photo.uuid);
        if (!photo.legacy_id) {
            console.log('warning: skipping record without legacy id for id: %s', photo.id);
            return;
        }
        return downloadImageAsync(url, destPath)
            .then(function () {
                return checksum.fileAsync(destPath);
            })
            .then(function (filehash) {
                return mongoose.model('Photo').findOneAndUpdate({id: photo.id}, {filehash: filehash});
            })
            .catch(function (err) {
                console.log('download error: %s for UUID %s', err.message, photo.uuid);
            });
    }, {concurrency: 10})
    .then(function () {
        console.log('done.');
    })
    .catch(function (err) {
        console.log('failed with error: %s', err.message);
        console.log(err.stack);
    });

function downloadImage(url, dest, cb) {
    var write = fs.createWriteStream(dest);
    write.on('close', function () {
        cb();
    });
    write.on('error', function (err) {
        cb(err);
    });
    request(url).pipe(write);
}