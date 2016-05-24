'use strict';

module.exports = function (query, req, config) {
    if (typeof config.query === 'object') {
        if (typeof config.query.id_mapping === 'string') {
            query[config.query.id_mapping] = req.params.uuid;
            delete config.query.id_mapping;
        }
        if (typeof config.query.user_mapping === 'string') {
            query[config.query.user_mapping] = req.user.uuid;
            delete config.query.user_mapping;
        }
        for (let key in config.query) {
            query[key] = config.query[key];
        }
    }
    return query;
};
