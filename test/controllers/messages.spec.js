"use strict";

var chai = require('chai'),
    util = require('../helper'),
    Promise = require('bluebird'),
    sinon = require('sinon'),
    chance = require('chance').Chance(),
    should = chai.should(),
    MessagesController = require('../../controllers/messages');

describe('MessagesController', () => {
    var currentUser, receiverUser, presetMessage,
        proxySend, req, res, next,
        senderTemplate, receiverTemplate, messageTemplate,
        messages = new MessagesController();

    let checkMessage = (user, msg, template) => {
        msg.user_uuid.should.equal(user.uuid);
        msg.recipient_uuid.should.equal(template.recipient_uuid);
        msg.body.should.equal(template.body);
        msg.subject_uuid.should.equal(template.subject_uuid);
        should.exist(msg.created);
        return true;
    };

    beforeEach(() => {
        senderTemplate = util.getFixture('User');
        receiverTemplate = util.getFixture('User');
        messageTemplate = util.getFixture('Message');
        proxySend = sinon.spy();
        res = {send: proxySend};
        return Promise.resolve()
            .then(() => {
                return util.mongoose.connection.db.dropDatabase();
            })
            .then(() => {
                return util.mongoose.model('User').create(senderTemplate)
                    .then((userObj) => {
                        currentUser = userObj;
                        return currentUser.confirmUser();
                    })
                    .then(() => {
                        return util.mongoose.model('User').create(receiverTemplate)
                    })
                    .then((userObj) => {
                        receiverUser = userObj;
                        return receiverUser.confirmUser();
                    })
                    .then(() => {
                        messageTemplate.recipient_uuid = currentUser.uuid;
                        messageTemplate.user_uuid = receiverUser.uuid;
                        return util.mongoose.model('Message').create(messageTemplate);
                    })
                    .then((msgObj) => {
                        presetMessage = msgObj;
                    });
            });
    });

    before(() => {
      return util.init();
    });
    after(() => {
      return util.tearDown();
    });

    it('creates a message', () => {
        var template = util.getFixture('Message');
        template.recipient_uuid = receiverUser.uuid;
        req = {
            user: currentUser,
            body: template
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(201);
            checkMessage(currentUser, proxySend.args[0][1], template);
        };
        return messages.coroutines.postResource.main(req, res, next, {resource: 'Message'});
    });

    it('fetches message index for user', () => {
        req = {
            user: currentUser,
            params: {uuid: 'me'},
            path: '/users/me/messages'
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(200);
            proxySend.args[0][1].length.should.equal(1);
            checkMessage(receiverUser, proxySend.args[0][1][0], messageTemplate);
        };
        return messages.coroutines.findResource.main(req, res, next, {resource: 'Message'});
    });

    it('user fetches a message addressed to him', () => {
        req = {
            user: currentUser,
            params: {uuid: presetMessage.uuid},
            path: '/messages/' + presetMessage.uuid
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(200);
            checkMessage(receiverUser, proxySend.args[0][1], messageTemplate);
        };
        return messages.coroutines.getResource.main(req, res, next, {resource: 'Message'});
    });

    it('user cannot fetch a message not addressed to him', () => {
        req = {
            user: receiverUser,
            params: {uuid: presetMessage.uuid},
            path: '/messages/' + presetMessage.uuid
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(403);
        };
        return messages.coroutines.getResource.main(req, res, next, {resource: 'Message'});
    });

    it('deletes a message', () => {
        req = {
            user: receiverUser,
            params: {uuid: presetMessage.uuid},
            path: '/messages/' + presetMessage.uuid
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(200);
        };
        return messages.coroutines.deleteResource.main(req, res, next, {resource: 'Message'});
    });
});
