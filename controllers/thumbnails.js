'use strict';

var path = require('path'),
    fs = require('fs'),
    sharp = require('sharp'),
    config = require('../config.json'),
    Promise = require('bluebird'),
    restify = require('restify'),
    CommonController = require('./common');

class ThumbnailsController extends CommonController {
    constructor() {
        super();

        function loadAndShowImage(thumbFile, res) {
            let input = fs.createReadStream(thumbFile);
            res.setHeader('Content-Type', 'image/jpeg');
            return input.pipe(res);
        }

        this.coroutines.getResource.main = Promise.coroutine(function* (req, res, next) {
            let thumbFile = path.join(config.file_storage.path, 'thumbs',
                    `${req.params.uuid}-${req.params.type}-${req.params.size}.jpg`),
                originalFile = path.join(config.file_storage.path, 'photos',
                    `${req.params.uuid}`),
                fsExists = Promise.promisify((file, cb) => {
                    fs.exists(file, (exists) => { cb(null, exists); });
                });

            if (!(yield fsExists(originalFile))) {
                return next(new restify.NotFoundError());
            }

            var input;

            if (!(yield fsExists(thumbFile))) {
                var size = req.params.size.split('x'),
                    width = Math.min(1000, Math.max(0, parseInt(size[0]))),
                    height = size.length === 2 ? Math.min(1000, Math.max(0, parseInt(size[1]))) : width,
                    imgpipe = sharp();

                if (req.params.type === 'square') {
                    imgpipe.resize(width, width || null, {
                        kernel: sharp.kernel.lanczos2,
                        interpolator: sharp.interpolator.nohalo
                    }).crop(sharp.strategy.entropy);
                } else {
                    imgpipe.resize(width || null, height || null, {
                        kernel: sharp.kernel.lanczos2,
                        interpolator: sharp.interpolator.nohalo
                    });
                }

                imgpipe.clone().jpeg().quality(80).toFile(thumbFile, (err) => {
                    if (err) {
                        throw err;
                    }
                    return loadAndShowImage(thumbFile, res);
                });

                input = fs.createReadStream(originalFile);
                input.pipe(imgpipe);
            } else {
                return loadAndShowImage(thumbFile, res);
            }
        });
    }
}

module.exports = ThumbnailsController;