'use strict';

var mongoose = require('mongoose'),
    Promise = require('bluebird'),
    captchapng = require('captchapng'),
    CommonController = require('./common');

class CaptchasController extends CommonController {
    constructor() {
        super();

        this.coroutines.getResource.main = Promise.coroutine(function* (req, res, next) {
            var code = parseInt(req.params.code);
            if (isNaN(code)) {
                res.send(404, false);
            } else {
                var captcha = yield mongoose.model('Captcha').findOneAndRemove({code: code});
                if (captcha) {
                    res.send(200, true);
                } else {
                    res.send(404, false);
                }
            }
            next();
        });

        this.coroutines.postResource.main = Promise.coroutine(function* (req, res, next) {
            var captcha = yield mongoose.model('Captcha').create({}),
                img = new captchapng(160, 60, captcha.code);
            img.color(0, 0, 0, 0);
            img.color(80, 80, 80, 255);
            res.setHeader('Content-Type', 'image/png');
            res.send(201, new Buffer(img.getBase64(), 'base64'));
            next();
        });
    }
}

module.exports = CaptchasController;