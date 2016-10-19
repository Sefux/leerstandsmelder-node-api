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
            let overrideType;
            switch (extension.toLowerCase()) {
                case '.jpg':
                    overrideType = 'image/jpeg';
                    break;
                case '.png':
                    overrideType = 'image/png';
                    break;
                default:
                    break;
            }
            if (overrideType) {
                req.headers['content-type'] = overrideType;
                req.headers.accept = overrideType;
                res.setHeader('content-type', overrideType);
            }
        }
        req.url = require('url').format(url);

        return next();
    };
};
