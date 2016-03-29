'use strict';

var restify = require('restify'),
    mongoose = require('mongoose'),
    config = require('./lib/config'),
    Promise = require('bluebird'),
    version = require("./package.json").version;

mongoose.Promise = Promise;

Promise.coroutine(function* () {
    yield config.load();

    if (typeof config.get !== 'object') {
        throw new Error('Server has not been configured yet. Please run bin/setup.');
    }

    var dburl = 'mongodb://' +
        config.get.mongodb.host + ':' +
        config.get.mongodb.port + '/' +
        config.get.mongodb.dbname;

    mongoose.connect(dburl);
    mongoose.model('Location', require('./models/location').Location);
    mongoose.model('Region', require('./models/region').Region);

    var server = restify.createServer({
        name: `Leerstandsmelder Legacy Redirect Server v${version}`,
        version: version
    });
    server.pre(restify.pre.userAgentConnection());
    server.use(restify.fullResponse());
    server.use(restify.gzipResponse());
    server.use(restify.authorizationParser());

    server.get('/:region_slug/places/:location_slug', function (req, res, next) {
        var redirect = config.get.redirect_server.redirect_host;
        return mongoose.model('Region').findOne({slug: req.params.region_slug})
            .then(function (region) {
                if (region) {
                    redirect += '/' + (region.slug || region.uuid);
                    return mongoose.model('Location').findOne({legacy_slug: req.params.location_slug});
                } else {
                    throw new Error();
                }
            })
            .then(function (location) {
                if (location) {
                    redirect += '/' + (location.slug || location.uuid);
                    res.setHeader('Location', redirect);
                    res.send(302);
                    next();
                } else {
                    throw new Error();
                }
            })
            .catch(function () {
                res.send(restify.NotFoundError());
                next();
            });
    });

    server.listen(config.get.redirect_server.port, config.get.redirect_server.host, function () {
        console.log(`${server.name} listening at ${server.url}`);
    });
})();