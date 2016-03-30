"use strict";

var kue = require('kue'),
    Promise = require('bluebird'),
    gm = require('gm'),
    fs = require('fs'),
    path = require('path'),
    queue = kue.createQueue();

queue.on('job enqueue', function (id, type) {
    console.log('Job %s got queued of type %s', id, type);
}).on('job complete', function (id, result) {
    kue.Job.get(id, function (err, job) {
        if (err) return;
        job.remove(function (err) {
            if (err) throw err;
            console.log('removed completed job #%d', job.id);
        });
    });
});

module.exports.startFrontend = function () {
    kue.app.listen(4444);
};

//
//
// Confirmation mail

queue.process('confirmationMail', 5, function (job, done) {
    if (!job.user) {
        done();
    }
    var domain = require('domain').create();
    domain.on('error', function (err) {
        done(err);
    });
    domain.run(function () { // your process function
        return job.user.sendConfirmationMail()
            .then(function () {
                done();
            })
            .catch(function (err) {
                done(err);
            });
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
    if (!job.user) {
        done();
    }
    var domain = require('domain').create();
    domain.on('error', function (err) {
        done(err);
    });
    domain.run(function () { // your process function
        return job.user.requestPasswordReset()
            .then(function () {
                done();
            })
            .catch(function (err) {
                done(err);
            });
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
    if (!job.data) {
        done();
    }
    var domain = require('domain').create();
    domain.on('error', function (err) {
        done(err);
    });
    domain.run(function () { // your process function
        gm(path.join(__dirname, '..', 'assets', 'photos', job.data.uuid))
            .resize('200', '200', '^>')
            .gravity('Center')
            .crop('200', '200')
            .write(path.join(__dirname, '..', 'assets', 'photos', job.data.uuid + '-thumb'), function (err) {
                done(err);
            });
    });
});

module.exports.createThumbnails = function (photo) {
    return Promise.resolve()
        .then(function () {
            var job = queue.create('createThumbs', photo);
            return Promise.promisify(function (cb) {
                job.save(cb);
            })();
        });
};