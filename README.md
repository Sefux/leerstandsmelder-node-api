# Leerstandsmelder API

[![Build Status](https://travis-ci.org/Leerstandsmelder/leerstandsmelder-node-api.svg?branch=master)](https://travis-ci.org/Leerstandsmelder/leerstandsmelder-node-api) [![dependency Status](https://david-dm.org/Leerstandsmelder/leerstandsmelder-node-api.svg)](https://david-dm.org/Leerstandsmelder/leerstandsmelder-node-api) [![devDependency Status](https://david-dm.org/Leerstandsmelder/leerstandsmelder-node-api/dev-status.svg)](https://david-dm.org/Leerstandsmelder/leerstandsmelder-node-api#info=devDependencies) [![bitHound Code](https://www.bithound.io/github/Leerstandsmelder/leerstandsmelder-node-api/badges/code.svg)](https://www.bithound.io/github/Leerstandsmelder/leerstandsmelder-node-api)

API server for [Leerstandsmelder.de](http://www.leerstandsmelder.de) based on [restify](http://restify.com) and written in ES6 JavaScript for [Node.js](https://nodejs.org).

This software is part of a complete relaunch of the platform, now making it open source and independent from Google's map service. The API has a pretty standard JSON-over-HTTP CRUD interface and adds an interface to basic geospatial queries through the 2D-index in MongoDB.

You can find the accompanying frontend and API client in the [Leerstandsmelder GitHub repositories](https://github.com/Leerstandsmelder).

## Requirements

* NodeJS 4.x or 6.x
* MongoDB 3.x
* Redis 3.x

## Setup

Install dependencies with ``npm install``, then create a config file by running ``./bin/setup.js``.

## Running

Start the server with
```
node app.js
```

### Management scripts

``./bin/add-user-scope.js /path/to/dir/`` dumps the DB to the specified location (do not omit the trailing slash) 

``./bin/backup.sh /path/to/dir/`` dumps the DB to the specified location (do not omit the trailing slash) 

``./bin/rebuild-acls.js`` purges and rebuilds all ACLs (caution: maybe make a backup before running this...)

``./bin/regenrate-slugs.js`` generates new slugs for all resources (again, caution: this might be based on altered existing URL structures and break all your links)

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

## Development

The project uses ES6 JavaScript and are encouraged to lint the code using [JSHint](http://jshint.com/)

### Testing ###

Uses Mocha and Chai. Run tests with ``npm test`` (tests are far from complete).