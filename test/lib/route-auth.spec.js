"use strict";

var chai = require('chai'),
    util = require('../helper'),
    Promise = require('bluebird'),
    restify = require('restify'),
    sinon = require('sinon'),
    chance = require('chance').Chance(),
    should = chai.should(),
    LocationsController = require('../../controllers/locations'),
    UsersController = require('../../controllers/users'),
    routes = require('../../lib/routes'),
    routeAuth = require('../../lib/auth/route-auth');

describe('RouteAuth', () => {
    var currentUser, currentUserAlt, currentLocation,
        proxyNext, req, res,
        locations = new LocationsController(),
        users = new UsersController();

    util.init();

    beforeEach(() => {
        var resourceProxy = sinon.spy();
        proxyNext = sinon.spy();
        res = {
            send: resourceProxy
        };
        return Promise.resolve()
            .then(() => {
                return routes.init([
                    require('../../routes/comments'),
                    require('../../routes/locations'),
                    require('../../routes/photos'),
                    require('../../routes/posts'),
                    require('../../routes/users')
                ]);
            })
            .then(() => {
                return util.mongoose.connection.db.dropDatabase();
            })
            .then(() => {
                var template = util.getFixture('User');
                template.confirmed = true;
                req = {
                    body: template,
                    path: '/user'
                };
                return users.coroutines.postResource.main(req, res, sinon.spy(), {resource: 'User'})
                    .then(() => {
                        currentUser = resourceProxy.args[0][1];
                    });
            })
            .then(() => {
                var template = util.getFixture('User');
                template.confirmed = true;
                req = {
                    body: template,
                    path: '/user'
                };
                return users.coroutines.postResource.main(req, res, sinon.spy(), {resource: 'User'})
                    .then(() => {
                        currentUserAlt = resourceProxy.args[1][1];
                    });
            })
            .then(() => {
                return util.mongoose.model('Location').remove({});
            })
            .then(() => {
                req = {
                    body: util.getFixture('Location'),
                    user: currentUser,
                    path: '/locations'
                };
                return locations.coroutines.postResource.main(req, res, sinon.spy(), {resource: 'Location'})
                    .then(() => {
                        currentLocation = resourceProxy.args[2][1];
                    });
            });
    });

    it('regular user may GET public resource', () => {
        req = {
            body: {},
            user: currentUser,
            path: '/locations/' + currentLocation.uuid,
            method: 'get',
            route: {
                path: '/locations/:uuid',
                method: 'get'
            }
        };
        return routeAuth(req, res, proxyNext)
            .then(() => {
                proxyNext.calledOnce.should.be.true;
                proxyNext.args[0].length.should.equal(0);
            });
    });

    it('anonymous user may GET public resource', () => {
        req = {
            body: {},
            path: '/locations/' + currentLocation.uuid,
            method: 'get',
            route: {
                path: '/locations/:uuid',
                method: 'get'
            }
        };
        return routeAuth(req, res, proxyNext)
            .then(() => {
                proxyNext.calledOnce.should.be.true;
                proxyNext.args[0].length.should.equal(0);
            });
    });

    it('regular user may POST resource', () => {
        req = {
            body: util.getFixture('Location'),
            user: currentUser,
            path: '/locations',
            method: 'post',
            route: {
                path: '/locations',
                method: 'post'
            }
        };
        return routeAuth(req, res, proxyNext)
            .then(() => {
                proxyNext.calledOnce.should.be.true;
                proxyNext.args[0].length.should.equal(0);
            });
    });

    it('anonymous may not POST resource', () => {
        req = {
            body: util.getFixture('Location'),
            path: '/locations',
            method: 'post',
            route: {
                path: '/locations',
                method: 'post'
            }
        };
        return routeAuth(req, res, proxyNext)
            .then(() => {
                proxyNext.calledOnce.should.be.true;
                proxyNext.args[0].length.should.equal(1);
                proxyNext.args[0][0].restCode.should.equal('NotAuthorized');
            });
    });

    it('owner may PUT resource', () => {
        req = {
            body: {
                title: chance.sentence({words: 3})
            },
            params: {
                uuid: currentLocation.uuid
            },
            path: '/locations/' + currentLocation.uuid,
            method: 'put',
            user: currentUser,
            route: {
                path: '/locations/:uuid',
                method: 'put'
            }
        };
        return routeAuth(req, res, proxyNext)
            .then(() => {
                proxyNext.calledOnce.should.be.true;
                proxyNext.args[0].length.should.equal(0);
            });
    });

    it('non-owner may not PUT resource', () => {
        req = {
            body: {
                title: chance.sentence({words: 3})
            },
            params: {
                uuid: currentLocation.uuid
            },
            path: '/locations/' + currentLocation.uuid,
            method: 'put',
            user: currentUserAlt,
            route: {
                path: '/locations/:uuid',
                method: 'put'
            }
        };
        return routeAuth(req, res, proxyNext)
            .then(() => {
                proxyNext.calledOnce.should.be.true;
                proxyNext.args[0].length.should.equal(1);
                proxyNext.args[0][0].restCode.should.equal('NotAuthorized');
            });
    });

    it('owner may DELETE resource', () => {
        req = {
            body: {},
            params: {
                uuid: currentLocation.uuid
            },
            path: '/locations/' + currentLocation.uuid,
            method: 'delete',
            user: currentUser,
            route: {
                path: '/locations/:uuid',
                method: 'delete'
            }
        };
        return routeAuth(req, res, proxyNext)
            .then(() => {
                proxyNext.calledOnce.should.be.true;
                proxyNext.args[0].length.should.equal(0);
            });
    });

    it('non-owner may not DELETE resource', () => {
        req = {
            body: {},
            params: {
                uuid: currentLocation.uuid
            },
            path: '/locations/' + currentLocation.uuid,
            method: 'delete',
            user: currentUserAlt,
            route: {
                path: '/locations/:uuid',
                method: 'delete'
            }
        };
        return routeAuth(req, res, proxyNext)
            .then(() => {
                proxyNext.calledOnce.should.be.true;
                proxyNext.args[0].length.should.equal(1);
                proxyNext.args[0][0].restCode.should.equal('NotAuthorized');
            });
    });
});