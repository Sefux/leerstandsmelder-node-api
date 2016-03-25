'use strict';
module.exports = function () {
    return function (req, res, next) {
        if (req.method.toLowerCase() === 'post') {
            if (req.body && req.body.uuid) {
                delete req.body.uuid;
            }
        }
        next();
    };
};