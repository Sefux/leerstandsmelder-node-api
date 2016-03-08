'use strict';
module.exports = function () {
    return function (req, res, next) {
        if (req.url.match(/\.(msgpack)/i)) {
            req.url = req.url.replace(/\.msgpack/i, '');
            req.headers['content-type'] = 'application/msgpack';
            req.headers.accept = 'application/msgpack';
        } else if (req.url.match(/\.(xml)/i)) {
            req.url = req.url.replace(/\.xml/i, '');
            req.headers['content-type'] = 'application/xml';
            req.headers.accept = 'application/xml';
        } else if (req.url.match(/\.(json)/i)) {
            req.url = req.url.replace(/\.json/i, '');
            req.headers['content-type'] = 'application/json';
            req.headers.accept = 'application/json';
        } else if (req.url.match(/\.(csv)/i)) {
            req.url = req.url.replace(/\.csv/i, '');
            req.headers['content-type'] = 'text/csv';
            req.headers.accept = 'text/csv';
        } else {
            req.url = req.url.replace(/\.[a-z]+$/i, '');
            if (!req.contentType()) {
                req.headers['content-type'] = 'application/octet-stream';
                req.headers.accept = 'application/octet-stream';
            }
        }
        res.setHeader('content-type', req.contentType());
        return next();
    };
};
