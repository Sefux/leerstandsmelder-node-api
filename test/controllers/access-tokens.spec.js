"use strict";

var chai = require('chai'),
    util = require('../helper'),
    Promise = require('bluebird'),
    sinon = require('sinon'),
    chance = require('chance').Chance(),
    should = chai.should(),
    accessTokenController = require('../../controllers/access-tokens');

describe('AccessTokensController', () => {
    var currentApiKey, currentApiKeyConfirmed,
        currentUser, currentUserConfirmed,
        proxySend, req, res, next,
        controller = accessTokenController,
        userTemplateConfirmed = util.getFixture('User');

    util.init();

    beforeEach(() => {
        proxySend = sinon.spy();
        res = {send: proxySend};
        return Promise.resolve()
            .then(() => {
                return util.mongoose.connection.db.dropDatabase();
            })
            .then(() => {
                return util.mongoose.model('User').create(util.getFixture('User'));
            })
            .then((userObj) => {
                currentUser = userObj;
                return util.mongoose.model('User').create(userTemplateConfirmed);
            })
            .then((userObj) => {
                userObj.confirmed = true;
                currentUserConfirmed = userObj;
                return util.mongoose.model('ApiKey').create({user_uuid: currentUser.uuid});
            })
            .then((apiKeyObj) => {
                currentApiKey = apiKeyObj;
                return util.mongoose.model('ApiKey').create({user_uuid: currentUserConfirmed.uuid});
            })
            .then((apiKeyObj) => {
                currentApiKeyConfirmed = apiKeyObj;
            });
    });

    it('authenticates with api key credentials', () => {
        req = {
            body: {
                key: currentApiKeyConfirmed.key,
                secret: currentApiKeyConfirmed.secret
            }
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(201);
            let token = proxySend.args[0][1];
            token.api_key.should.equal(currentApiKeyConfirmed.key);
            token.hours_valid.should.equal(1440);
            token.token.length.should.equal(256);
        };
        return controller.post(req, res, next);
    });

    it('authenticates with login and password', () => {
        req = {
            body: {
                email: currentUserConfirmed.email,
                password: userTemplateConfirmed.password
            }
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(201);
            let token = proxySend.args[0][1];
            token.api_key.should.exist;
            token.hours_valid.should.equal(1440);
            token.token.length.should.equal(256);
        };
        return controller.post(req, res, next);
    });
});