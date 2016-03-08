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

    util.init();

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
                    });
            });
    });

    it('creates a user', () => {
        var template = util.getFixture('User');
        req = {
            body: template
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(201);
            proxySend.args[0][1].login.should.equal(template.login);
            proxySend.args[0][1].email.should.equal(template.email);
        };
        return users.coroutines.postResource.main(req, res, next);
    });

    it('confirms a user', () => {
        req = {
            params: {token: currentUser.single_access_token}
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(200);
        };
        return users.coroutines.confirmUserResource.main(req, res, next, {resource: 'User'});
    });

    it('fetches a user', () => {
        req = {
            user: currentUser,
            params: {uuid: currentUser.uuid}
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(200);
            proxySend.args[0][1].login.should.equal(userTemplate.login);
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
            body: {login: 'asdfasdf'}
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(200);
            proxySend.args[0][1].login.should.equal(req.body.login);
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
        return users.coroutines.delResource.main(req, res, next, {resource: 'User'});
    });
});