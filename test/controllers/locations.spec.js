"use strict";

var chai = require('chai'),
    util = require('../helper'),
    Promise = require('bluebird'),
    sinon = require('sinon'),
    chance = require('chance').Chance(),
    should = chai.should(),
    LocationsController = require('../../controllers/locations');

describe('LocationsController', () => {
    var currentUser, currentLocation, currentRegion,
        currentLocationHide, currentRegionHide,
        proxySend, req, res, next, locationTemplate,
        controller = new LocationsController();

    beforeEach(() => {
        locationTemplate = util.getFixture('Location');
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
                locationTemplate.user_uuid = currentUser.uuid;
                return locationTemplate;
            })
            .then(() => {
                return util.mongoose.model('Region').create(util.getFixture('Region'));
            })
            .then((regionObj) => {
                currentRegion = regionObj;
                locationTemplate.region_uuid = currentRegion.uuid;
                return util.mongoose.model('Location').create(locationTemplate);
            })
            .then((locationObj) => {
                currentLocation = locationObj;
            })
            .then(() => {
                //create hidden region
                var regionTemplateHide = util.getFixture('Region');
                regionTemplateHide.hide = true;
                return util.mongoose.model('Region').create(regionTemplateHide);
            })
            .then((regionObjHide) => {
                currentRegionHide = regionObjHide;
                locationTemplate.region_uuid = currentRegionHide.uuid;
                return util.mongoose.model('Location').create(locationTemplate);
            })
            .then((locationObjHide) => {
                currentLocationHide = locationObjHide;
            })
            .catch((err) => {
                console.log(err.message);
            });
    });

    before(() => {
      return util.init();
    });
    after(() => {
      return util.tearDown();
    });

    it('creates a location', () => {
        req = {
            body: locationTemplate,
            user: currentUser
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(201);
        };
        return controller.coroutines.postResource.main(req, res, next, {resource: 'Location'});
    });

    it('fetches a location', () => {
        req = {
            params: {uuid: currentLocation.uuid}
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(200);
        };
        return controller.coroutines.getResource.main(req, res, next, {resource: 'Location'});
    });

    it('does NOT fetch a location from a hidden region', () => {
        req = {
            params: {uuid: currentLocationHide.uuid}
        };
        next = () => {
          proxySend.calledOnce.should.be.false;
        };
        return controller.coroutines.getResource.main(req, res, next, {resource: 'Location'});
    });

    it('updates a location', () => {
        var newTitle = chance.sentence({words: 3});
        req = {
            user: currentUser,
            params: {uuid: currentLocation.uuid},
            body: {title: newTitle}
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(200);
            proxySend.args[0][1].title.should.equal(newTitle);
        };
        return controller.coroutines.putResource.main(req, res, next, {resource: 'Location'});
    });

    it('deletes a location', () => {
        req = {
            user: currentUser,
            params: {uuid: currentLocation.uuid},
            path: '/locations/' + currentLocation.uuid
        };
        next = () => {
            proxySend.calledOnce.should.be.true;
            proxySend.calledWith(200);
        };
        return controller.coroutines.deleteResource.main(req, res, next, {resource: 'Location'});
    });
});
