'use strict';
module.exports = function (obj, key, value, condition) {
    if (condition === true || (condition !== false && value)) {
        obj[key] = value;
    }
    return obj;
};