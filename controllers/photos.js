'use strict';

var Promise = require('bluebird'),
    mongoose = require('mongoose'),
    path = require('path'),
    fs = require('fs-extra'),
    aclManager = require('../lib/auth/acl-manager'),
    mongoHandler = require('../lib/util/response-handlers');

module.exports.get = function (req, res, next) {
    mongoose.model('Photo').findOne({uuid: req.params.uuid})
        .exec(function (err, photo) {
            if (err) {
                res.send(mongoHandler.handleError(err));
            } else {
                var restify = require('restify');
                if (photo) {
                    var readStream = fs.createReadStream(path.join('assets/photos', photo.uuid));
                    readStream.on('error', function (err) {
                        console.log(`Error reading image file: ${err.message}`);
                        res.send(new restify.NotFoundError());
                    });
                    res.setHeader("Content-Type", photo.mime_type);
                    readStream.pipe(res);
                } else {
                    res.send(new restify.NotFoundError());
                }
            }
            next();
        });
};

module.exports.post = function (req, res, next) {
    var checksum = require('checksum'),
        file = req.files.file,
        payload = {
            location_uuid: req.params.location_uuid,
            author_uuid: req.user.uuid,
            creator_uuid: req.user.uuid,
            publisher_uuid: req.user.uuid,
            rights_holder_uuid: req.user.uuid,
            filename: file.name,
            extension: path.extname(file.name),
            mime_type: file.type,
            filehash: file.hash,
            size: file.size
        };
    return Promise.promisify(checksum.file)(file.path)
        .then((filehash) => {
            payload.filehash = filehash;
            return mongoose.model('Photo').create(payload);
        })
        .then((photo) => {
            var dest = path.join('assets', 'photos', photo.uuid),
                readStream = fs.createReadStream(file.path),
                writeStream = fs.createWriteStream(dest),
                errorHandler = (err) => {
                    throw new Error('Failed to upload photo: ' + err.message);
                };
            readStream.on('error', errorHandler);
            writeStream.on('error', errorHandler);
            readStream.pipe(writeStream);
            return new Promise(function (resolve, reject) {
                writeStream.on('finish', function () {
                    resolve(photo);
                });
            });
        })
        .then((photo) => {
            return aclManager.setAclEntry(req.path + '/' + result.uuid, [req.user.uuid, 'admin'], ['get', 'put', 'post', 'delete'])
                .then(() => {
                    return photo;
                });
        })
        .then((photo) => {
            // TODO: we need a correct content type here, do not return the original multipart one
            // for now we do not return the created photo object, this is hacky
            // res.header('Content-Type', 'application/json');
            res.send(200);
            next();
        })
        .catch((err) => {
            res.send(mongoHandler.handleError(err));
            next();
        });
};