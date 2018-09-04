# MapOZ API

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4710609f84ea4e9f9796ed1ca45f6e72)](https://www.codacy.com/app/dasantonym/leerstandsmelder-node-api?utm_source=github.com&utm_medium=referral&utm_content=Leerstandsmelder/leerstandsmelder-node-api&utm_campaign=badger)
[![Build Status](https://travis-ci.org/Leerstandsmelder/leerstandsmelder-node-api.svg?branch=master)](https://travis-ci.org/Leerstandsmelder/leerstandsmelder-node-api) [![dependency Status](https://david-dm.org/Leerstandsmelder/leerstandsmelder-node-api.svg)](https://david-dm.org/Leerstandsmelder/leerstandsmelder-node-api) [![devDependency Status](https://david-dm.org/Leerstandsmelder/leerstandsmelder-node-api/dev-status.svg)](https://david-dm.org/Leerstandsmelder/leerstandsmelder-node-api#info=devDependencies) [![bitHound Code](https://www.bithound.io/github/Leerstandsmelder/leerstandsmelder-node-api/badges/code.svg)](https://www.bithound.io/github/Leerstandsmelder/leerstandsmelder-node-api)

API server for [city-of-oz.hamburg](http://map.city-of-oz.hamburg) based on [restify](http://restify.com) and written in ES6 JavaScript for [Node.js](https://nodejs.org).

This software is part of a complete relaunch of the platform, now making it open source and independent from Google's map service. The API has a pretty standard JSON-over-HTTP CRUD interface and adds an interface to basic geospatial queries through the 2D-index in MongoDB.

You can find the accompanying frontend and API client in the [MapOZ GitHub repositories](https://github.com/sefux/mapoz-angular-frontend).

## Requirements

* NodeJS 6.x or 8.x
* MongoDB 3.x
* Redis 3.x

## Setup

Install dependencies with ``npm install``, copy ``config.default.json`` to ``config.json``. You can then create an admin user by running ``./bin/setup.js``.

## Running

Start the server with
```
node app.js
```

### Management scripts

``./bin/add-user-scope.js --email=user@host.com --scope=SCOPE_TO_SET`` adds the specified scope (e.g. ``admin``, ``editor`` or a region admin with ``region-REGION_UUID``) to the API Key associated with the supplied email address.

``./bin/backup.sh /path/to/dir/`` dumps the DB to the specified location (do not omit the trailing slash) 

``./bin/rebuild-acls.js`` purges and rebuilds all ACLs (caution: maybe make a backup before running this...)

### Redirecting legacy URLs

There is a bundled redirect-server which can be mapped to legacy-style URLs and redirect them accordingly. Set it up in ``config.json`` and start it with

```
node ./legacy-redirect.js
```

Then map it with a regular expression as shown in this example for Nginx:

```
location ~* ^/[a-z,0-9,-]+/places/[a-z,0-9,-]+$ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_pass http://localhost:7070;
    proxy_redirect off;
    proxy_buffering off;
}
```

## Documentation

The API is documented using [Swagger](http://swagger.io/) and is served at ``/api-docs`` at the respective API host. You can start a webserver to view the documentation by running
```
gulp swagger
```

## Development

The project uses ES6 JavaScript and you are encouraged to lint the code using [JSHint](http://jshint.com/) before pushing it or creating a pull request.

### Testing ###

Uses Mocha and Chai. Run tests with ``npm test`` (tests are far from complete).
