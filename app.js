'use strict';

var restify = require('restify'),
    mongoose = require('mongoose'),
    swagger = require('swagger-node-restify'),
    swaggerModels = {},
    corsMiddleware = require('restify-cors-middleware'),
    urlExtParser = require('./lib/parsers/urlext-parser'),
    filterUUID = require('./lib/util/filter-uuid'),
    tokenAuth = require('./lib/auth/token-auth'),
    routeAuth = require('./lib/auth/route-auth'),
    validateCaptcha = require('./lib/auth/validate-captcha'),
    userAliasParser = require('./lib/parsers/user-alias-parser'),
    workers = require('./lib/workers'),
    config = require('./config.json'),
    fs = require('fs-extra'),
    Promise = require('bluebird'),
    errorReporter = require('./lib/util/error-reporter');

var cors = corsMiddleware({
  preflightMaxAge: 5, //Optional
  origins: config.frontend.origins,
  credentials: config.frontend.credentials,
  allowHeaders: ['Authorization', 'Basic']
});

mongoose.Promise = Promise;
Promise.promisifyAll(fs);

Promise.coroutine(function* () {
    var path = require('path'),
        version = require("./package.json").version;

    if (typeof config !== 'object') {
        throw new Error('Server has not been configured yet. Please run bin/setup.');
    }

    if (config.airbrake) {
        errorReporter.init(config.airbrake);
    }

    if (config.workers.use_frontend) {
        workers.startFrontend(config.workers.frontend_port);
    }

    yield fs.mkdirpAsync(path.resolve(path.join(config.file_storage.path, 'photos')));
    yield fs.mkdirpAsync(path.resolve(path.join(config.file_storage.path, 'thumbs')));
    yield fs.mkdirpAsync(path.resolve('tmp'));

    var dburl = 'mongodb://' +
        config.mongodb.host + ':' +
        config.mongodb.port + '/' +
        config.mongodb.dbname;

    function addModel(name, data) {
        mongoose.model(name, data[name]);
        if (data.SwaggerSpec) {
            let spec = data.SwaggerSpec;
            spec.id = name;
            swaggerModels[name] = data.SwaggerSpec;
        }
    }

    mongoose.connect(dburl, {
        useMongoClient: true
    });
    addModel('User', require('./models/user'));
    addModel('ApiKey', require('./models/api-key'));
    addModel('AccessToken', require('./models/access-token'));
    addModel('AclEntry', require('./models/acl-entry'));
    addModel('Captcha', require('./models/captcha'));
    addModel('Comment', require('./models/comment'));
    addModel('Location', require('./models/location'));
    addModel('Message', require('./models/message'));
    addModel('Region', require('./models/region'));
    addModel('Photo', require('./models/photo'));
    addModel('Post', require('./models/post'));

    var server = restify.createServer({
        name: `MAPOZ API Server v${version}`,
        version: version
    });
    restify.defaultResponseHeaders = function() {
        this.header('Content-type', 'application/json; encoding=utf-8');
    };
    server.pre(cors.preflight);
    server.pre(restify.pre.userAgentConnection());
    server.pre(urlExtParser());

    // server.use(cors.actual);

    // preflightEnabler(server, {headers: ['Authorization', 'Basic']});

    server.use(restify.plugins.fullResponse());
    server.use(restify.plugins.gzipResponse());
    server.use(restify.plugins.authorizationParser());
    server.use(tokenAuth());
    server.use(routeAuth);
    server.use(userAliasParser());
    server.use(restify.plugins.bodyParser());
    server.use(restify.plugins.queryParser());
    server.use(filterUUID());
    server.use(validateCaptcha());

    var routes = require('./lib/routes');
    yield routes.init([
        require('./routes/captchas'),
        require('./routes/comments'),
        require('./routes/locations'),
        require('./routes/messages'),
        require('./routes/regions'),
        require('./routes/ping'),
        require('./routes/photos'),
        require('./routes/posts'),
        require('./routes/users')
    ]);

    swagger.setAppHandler(server);
    swagger.configureSwaggerPaths("", "/api-docs", "");
    swagger.addModels({ models: swaggerModels });

    yield Promise.map(Object.keys(routes.paths), function (rPath) {
        return Promise.map(Object.keys(routes.paths[rPath]), function (method) {
            var routeType = routes.paths[rPath][method].overrideVerb || method,
                route = {
                    spec: routes.paths[rPath][method].spec || {},
                    action: routes.paths[rPath][method].controller
                };

            if (!route.spec.path) {
                route.spec.path = rPath;
            }
            if (!route.spec.nickname) {
                route.spec.nickname = method + route.spec.type;
            }
            swagger["add" + routeType.toUpperCase()](route);
        });
    });

    let apiConf = config.api_server,
        apiUrl = `${apiConf.secure ? "https" : "http"}://${apiConf.host}:${apiConf.port}`;
    swagger.configure(apiUrl, version);

    server.listen(config.api_server.port, config.api_server.host, function () {
        console.log(`${server.name} listening at ${server.url}`);
    });
})();
