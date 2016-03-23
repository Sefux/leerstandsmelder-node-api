'use strict';

var mongoose = require('mongoose'),
    chance = require('chance').Chance(),
    uuid = require('../lib/util/uuid'),
    acl = require('../lib/auth/acl-manager'),
    dburl = 'mongodb://127.0.0.1:27017/leerstandsmelder-api-test';

module.exports.mongoose = mongoose;
module.exports.acl = acl;

module.exports.init = function () {
    var _mongoose = module.exports.mongoose;
    if (!_mongoose.connection || _mongoose.connection.readyState === 0) {
        _mongoose.connect(dburl);
        _mongoose.model('User', require('../models/user').User);
        _mongoose.model('ApiKey', require('../models/api-key').ApiKey);
        _mongoose.model('AccessToken', require('../models/access-token').AccessToken);
        _mongoose.model('AclEntry', require('../models/acl-entry').AclEntry);
        _mongoose.model('Comment', require('../models/comment').Comment);
        _mongoose.model('Location', require('../models/location').Location);
        _mongoose.model('Region', require('../models/region').Region);
        _mongoose.model('Photo', require('../models/photo').Photo);
        _mongoose.model('Post', require('../models/post').Post);
    }
};

module.exports.getFixture = function (resource) {
    switch(resource) {
        case 'User':
            return {
                login: chance.name(),
                email: chance.email(),
                password: chance.word({length: 8})
            };
        case 'Location':
            return {
                title: chance.sentence({words: 3}),
                description: chance.paragraph({sentences: 12}),
                degree: chance.word({length: 8}),
                rumor: chance.integer({min: 0, max: 3}),
                emptySince: chance.date(),
                buildingType: chance.word({length: 8}),
                street: chance.address(),
                city: chance.city(),
                postcode: chance.zip(),
                lonlat: [chance.longitude(), chance.latitude()],
                legacy_id: chance.word({length: 8}),
                region_uuid: uuid.v4()
            };
        default:
            throw new Error('no fixture available for ' + resource);
    }
};