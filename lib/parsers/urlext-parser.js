'use strict';
module.exports = function () {
    return function (req, res, next) {
        // TODO: urlext parser needs to be rewritten
        var query, replaced = false;
        if (req.url.match(/\?/i)) {
            query = req.url.split('?').pop();
        }
        if (req.url.match(/\.(msgpack)/i)) {
            replaced = true;
            req.url = req.url.replace(/\.msgpack(\?.*)?$/i, '');
            req.headers['content-type'] = 'application/msgpack';
            req.headers.accept = 'application/msgpack';
        } else if (req.url.match(/\.(xml)/i)) {
            replaced = true;
            req.url = req.url.replace(/\.xml(\?.*)?$/i, '');
            req.headers['content-type'] = 'application/xml';
            req.headers.accept = 'application/xml';
        } else if (req.url.match(/\.(json)/i)) {
            replaced = true;
            req.url = req.url.replace(/\.json(\?.*)?$/i, '');
            req.headers['content-type'] = 'application/json';
            req.headers.accept = 'application/json';
        } else if (req.url.match(/\.(csv)/i)) {
            replaced = true;
            req.url = req.url.replace(/\.csv(\?.*)?$/i, '');
            req.headers['content-type'] = 'text/csv';
            req.headers.accept = 'text/csv';
        } else if (req.url.match(/\.[a-z]+(\?.*)?$/i)) {
            replaced = true;
            req.url = req.url.replace(/\.[a-z]+(\?.*)?$/i, '');
            if (!req.contentType()) {
                req.headers['content-type'] = 'application/octet-stream';
                req.headers.accept = 'application/octet-stream';
            }
        }
        if (query && replaced) {
            req.url += '?' + query;
        }
        res.setHeader('content-type', req.contentType());
        return next();
    };
};
