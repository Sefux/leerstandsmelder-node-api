'use strict';

var mongoose = require('mongoose'),
    Promise = require('bluebird'),
    restifyErrors = require('restify-errors'),
    CommonController = require('./common');

class MessagesController extends CommonController {
    constructor() {
        super();

        this.coroutines.findResource.main = Promise.coroutine(function* (req, res, next) {
            var messages = yield mongoose.model('Message').find({$or: [{user_uuid: req.user.uuid}, {recipient_uuid: req.user.uuid}]})
                .sort('-created').exec();
            for (let i in messages) {
                let obj = messages[i].toObject();
                if (obj.hasOwnProperty('recipient_uuid')) {
                    obj.recipient = yield mongoose.model('User').findOne({uuid: obj.recipient_uuid})
                        .select('uuid nickname').exec();
                }
                if (obj.hasOwnProperty('user_uuid')) {
                    obj.user = yield mongoose.model('User').findOne({uuid: obj.user_uuid})
                        .select('uuid nickname').exec();
                }
                messages[i] = obj;
            }
            res.send(200, messages);
            return next();
        });

        /*
        this.coroutines.postResource.pre = Promise.coroutine(function* (req) {
            req.body.user_uuid = req.user.uuid;
        });
        */

        this.coroutines.getResource.main = Promise.coroutine(function* (req, res, next) {
            var message = yield mongoose.model('Message').findOne({uuid: req.params.uuid});
            if (req.user.uuid === message.user_uuid || req.user.uuid === message.recipient_uuid) {
                res.send(200, message);
                return next();
            }
            next(new restifyErrors.NotAuthorizedError());
        });
    }
}

module.exports = MessagesController;
