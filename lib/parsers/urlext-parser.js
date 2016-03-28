'use strict';
module.exports = function () {
    return function (req, res, next) {
        var url = require('url').parse(req.url),
            extension = require('path').extname(url.pathname),
            splitPath = url.pathname.split('.');

        if (splitPath.length > 1) {
            splitPath.pop();
        }

        url.pathname = splitPath.join('.');

        if (extension && extension.length > 0) {
            switch (extension.toLowerCase()) {
                case '.json':
                    req.headers['content-type'] = 'application/json';
                    req.headers.accept = 'application/json';
                    break;
                case '.jpg':
                    req.headers['content-type'] = 'image/jpeg';
                    req.headers.accept = 'image/jpeg';
                    break;
                case '.png':
                    req.headers['content-type'] = 'image/png';
                    req.headers.accept = 'image/png';
                    break;
                default:
                    req.headers['content-type'] = 'application/octet-stream';
                    req.headers.accept = 'application/octet-stream';
            }
        }
        req.url = require('url').format(url);

        res.setHeader('content-type', req.contentType());
        return next();
    };
};
