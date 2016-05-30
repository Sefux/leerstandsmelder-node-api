'use strict';

module.exports = function (query, req, config) {
    if (typeof config.query === 'object') {
        if (typeof config.query.id_mapping === 'string') {
            query[config.query.id_mapping] = req.params.uuid;
        }
        if (typeof config.query.user_mapping === 'string') {
            query[config.query.user_mapping] = req.user.uuid;
        }
        for (let key in config.query) {
            if (key !== 'id_mapping' && key !== 'user_mapping') {
                query[key] = config.query[key];
            }
        }
    }
    return query;
};
