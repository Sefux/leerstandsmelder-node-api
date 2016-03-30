"use strict";

var kue = require('kue'),
    Promise = require('bluebird'),
    gm = require('gm'),
    fs = require('fs'),
    queue = kue.createQueue();

kue.app.listen(3000);

//
//
// Confirmation mail

queue.process('confirmationMail', 5, function (job, done) {
    return Promise.resolve(job.user.sendConfirmationMail())
        .then(function () {
            done();
        })
        .catch(function (err) {
            done(err);
        });
});

module.exports.sendConfirmationMail = function (user) {
    return Promise.resolve()
        .then(function () {
            var job = queue.create('confirmationMail', user).attempts(10).backoff({delay: 60 * 1000, type: 'fixed'});
            return Promise.promisify(function (cb) {
                job.save(cb);
            })();
        });
};

//
//
// Password reset

queue.process('resetMail', 5, function (job, done) {
    return Promise.resolve(job.user.requestPasswordReset())
        .then(function () {
            done();
        })
        .catch(function (err) {
            done(err);
        });
});

module.exports.sendResetMail = function (user) {
    return Promise.resolve()
        .then(function () {
            var job = queue.create('resetMail', user).attempts(10).backoff({delay: 60 * 1000, type: 'fixed'});
            return Promise.promisify(function (cb) {
                job.save(cb);
            })();
        });
};

//
//
// Create thumbnails

queue.process('createThumbs', 5, function (job, done) {
    return Promise.promisify(function (cb) {
            gm('../assets/photos/' + job.data.uuid)
                .resize('200', '200', '^>')
                .gravity('Center')
                .crop('200', '200')
                .write('../assets/photos/' + job.data.uuid + '-thumb', function (err) {
                    cb(err);
                });
        })()
        .catch(function (err) {
            done(err);
        });
});

module.exports.createThumbnails = function (photo, delay) {
    return Promise.resolve()
        .then(function () {
            var job = queue.create('createThumbs', photo).delay(delay).attempts(3);
            return Promise.promisify(function (cb) {
                job.save(cb);
            })();
        });
};