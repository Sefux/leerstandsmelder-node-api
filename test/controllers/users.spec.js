"use strict";

var chai = require('chai'),
    util = require('../helper'),
    Promise = require('bluebird'),
    sinon = require('sinon'),
    chance = require('chance').Chance(),
    should = chai.should(),
    UsersController = require('../../controllers/users');

describe('UsersController', () => {
    var currentUser, proxySend, req, res, next,
        users = new UsersController(),
        userTemplate;

    beforeEach(() => {
        userTemplate = util.getFixture('User');
        proxySend = sinon.spy();
        res = {send: proxySend};
        return Promise.resolve()
            .then(() => {
                return util.mongoose.connection.db.dropDatabase();
            })
            .then(() => {
                return util.mongoose.model('User').create(userTemplate)
                    .then((userObj) => {
                        currentUser = userObj;
                        return currentUser.confirmUser();
                    });
            });
    });

    before(() => {
      return util.init();
    });
    after(() => {
      return util.tearDown();
    });

    it('creates a user', () => {
        var template = util.getFixture('User');
        req = {
            body: template,
            query: { noconfirm: true }
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(201);
            proxySend.args[0][1].nickname.should.equal(template.nickname);
            proxySend.args[0][1].email.should.equal(template.email);
        };
        return users.coroutines.postResource.main(req, res, next);
    });

    it('fetches a user', () => {
        req = {
            user: currentUser,
            params: {uuid: currentUser.uuid}
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(200);
            proxySend.args[0][1].nickname.should.equal(userTemplate.nickname);
            proxySend.args[0][1].email.should.equal(userTemplate.email);
            should.not.exist(proxySend.args[0][1].crypted_password);
            should.not.exist(proxySend.args[0][1].password_salt);
        };
        return users.coroutines.getResource.main(req, res, next, {resource: 'User'});
    });

    it('updates a user', () => {
        req = {
            user: currentUser,
            params: {uuid: currentUser.uuid},
            body: {nickname: chance.name()}
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(200);
            proxySend.args[0][1].nickname.should.equal(req.body.nickname);
        };
        return users.coroutines.putResource.main(req, res, next, {resource: 'User'});
    });

    it('deletes a user', () => {
        req = {
            user: currentUser,
            params: {uuid: currentUser.uuid},
            path: '/users/' + currentUser.uuid
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(200);
        };
        return users.coroutines.deleteResource.main(req, res, next, {resource: 'User'});
    });
});
