# Leerstandsmelder API

[![dependency Status](https://david-dm.org/Leerstandsmelder/leerstandsmelder-node-api.svg)](https://david-dm.org/Leerstandsmelder/leerstandsmelder-node-api) [![devDependency Status](https://david-dm.org/Leerstandsmelder/leerstandsmelder-node-api/dev-status.svg)](https://david-dm.org/Leerstandsmelder/leerstandsmelder-node-api#info=devDependencies)

API server for [Leerstandsmelder.de](http://www.leerstandsmelder.de) based on [restify](http://restify.com) and written in ES6 JavaScript for [Node.js](https://nodejs.org).

This software is part of a complete relaunch of the platform, now making it open source and independent from Google's map service. The API has a pretty standard JSON-over-HTTP CRUD interface and adds an interface to basic geospatial queries through the 2D-index in MongoDB.

## Requirements

* NodeJS 4.2.x (or io.js)
* MongoDB 3.0.x

## Installing

Install dependencies
```shell
npm install
```

Then create a config file
```
cd bin
./setup
```

## Running

Start the server with
```
node app.js
```

## Development

Uses Mocha and Chai. Run tests with ``npm test``.

## Todo

Update this readme, write more tests, write some API docs...