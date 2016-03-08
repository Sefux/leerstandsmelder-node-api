'use strict';

var restify = require('restify'),
    mongoose = require('mongoose'),
    preflightEnabler = require('se7ensky-restify-preflight'),
    urlExtParser = require('./lib/parsers/urlext-parser'),
    tokenAuth = require('./lib/auth/token-auth'),
    routeAuth = require('./lib/auth/route-auth'),
    userAliasParser = require('./lib/parsers/user-alias-parser'),
    acl = require('./lib/auth/acl-manager'),
    config = require('./lib/config'),
    fs = require('fs-extra'),
    Promise = require('bluebird');

Promise.promisifyAll(fs);

Promise.coroutine(function* () {
    var path = require('path'),
        version = require("./package.json").version;

    yield config.load();

    if (typeof config.get !== 'object') {
        throw new Error('Server has not been configured yet. Please run bin/setup.');
    }

    yield fs.mkdirpAsync(path.resolve('./assets/photos'));
    yield fs.mkdirpAsync(path.resolve('tmp'));

    var dburl = 'mongodb://' +
        config.get.mongodb.host + ':' +
        config.get.mongodb.port + '/' +
        config.get.mongodb.dbname;

    mongoose.connect(dburl);
    mongoose.model('User', require('./models/user').User);
    mongoose.model('ApiKey', require('./models/api-key').ApiKey);
    mongoose.model('AccessToken', require('./models/access-token').AccessToken);
    mongoose.model('Challenge', require('./models/challenge').Challenge);
    mongoose.model('Comment', require('./models/comment').Comment);
    mongoose.model('Location', require('./models/location').Location);
    mongoose.model('Photo', require('./models/photo').Photo);
    mongoose.model('Post', require('./models/post').Post);

    acl.init(mongoose.connection.db);

    var server = restify.createServer({
        name: `Leerstandsmelder API Server v${version}`,
        version: version
    });
    server.pre(restify.pre.userAgentConnection());
    server.pre(urlExtParser());

    server.use(restify.CORS({
        credentials: true,
        origins: ['*'],
        allow_headers: ['Authorization', 'Basic']
    }));

    preflightEnabler(server, {headers: ['Authorization', 'Basic']});

    server.use(restify.fullResponse());
    server.use(restify.gzipResponse());
    server.use(restify.authorizationParser());
    server.use(tokenAuth());
    server.use(routeAuth);
    server.use(userAliasParser());
    server.use(restify.bodyParser());
    server.use(restify.queryParser());

    var routes = require('./lib/routes');
    yield routes.init([
        require('./routes/comments'),
        require('./routes/locations'),
        require('./routes/photos'),
        require('./routes/posts'),
        require('./routes/users')
    ]);

    yield Promise.map(Object.keys(routes.paths), function (rPath) {
        return Promise.map(Object.keys(routes.paths[rPath]), function (method) {
            var routeType = routes.paths[rPath][method].overrideVerb || method;
            server[routeType](rPath, routes.paths[rPath][method].controller);
        });
    });

    server.listen(config.get.api_server.port, config.get.api_server.host, function () {
        console.log(`${server.name} listening at ${server.url}`);
    });
})();