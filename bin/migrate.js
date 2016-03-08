#!/usr/bin/env node

'use strict';

var Promise = require('bluebird'),
    mysql = require('mysql'),
    mongoose = require('mongoose'),
    path = require('path'),
    secureRandom = require('secure-random'),
    fs = require('fs-extra'),
    config = require('../lib/config');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'leerstandsmelder',
    port: 8889
});

Promise.promisifyAll(connection);
Promise.promisifyAll(fs);

Promise.promisify(config.load)()
    .then(function () {
        if (!config.get) {
            throw new Error('Server has not been configured yet. Please run bin/setup.');
        }
        var dburl = 'mongodb://' +
            config.get.mongodb.host + ':' +
            config.get.mongodb.port + '/' +
            config.get.mongodb.dbname;
        mongoose.connect(dburl);
        mongoose.model('User', require('../models/user').User);
        mongoose.model('Comment', require('../models/comment').Comment);
        mongoose.model('Location', require('../models/location').Location);
        mongoose.model('Photo', require('../models/photo').Photo);
        mongoose.model('Post', require('../models/post').Post);
        connection.connect();
        return fs.mkdirpAsync(path.join('..', 'assets', 'photos'));
    })
    .then(function () {
        return importUsers();
    })
    .then(function () {
        return importPlaces();
    })
    .then(function () {
        return importPhotos();
    })
    .then(function () {
        return importComments();
    })
    .then(function () {
        return importPosts();
    })
    .then(function () {
        return importPostComments();
    })
    .then(function () {
        tearDown();
    })
    .catch(function (err) {
        tearDown(err);
    });

function importUsers() {
    var count = 0;
    return connection.queryAsync('SELECT * FROM users')
        .then(function (rows) {
            return rows[0];
        })
        .map(function (user) {
            var passbytes = secureRandom.randomBuffer(16);
            var userObject = {
                nickname: user.nickname,
                login: user.email,
                password: passbytes.toString('hex'),
                email: user.email,
                legacy_id: user.id,
                last_login: user.last_sign_in_at,
                confirmed: user.confirmed_at !== null,
                created: user.created_at,
                updated: user.updated_at
            };
            return insertOrUpdate(userObject, 'User')
                .then(function () {
                    count += 1;
                    if (count % 500 === 0) {
                        console.log('processed %d users', count);
                    }
                })
                .catch(function (err) {
                    console.log('warning: could not insert user for legacy id %s with error: %s', userObject.legacy_id, err.message);
                });
        }, {concurrency: 10})
        .then(function () {
            console.log('done processing %d users', count);
        });
}

function importPlaces() {
    var count = 0;
    return connection.queryAsync('SELECT * FROM places')
        .then(function (rows) {
            return rows[0];
        })
        .map(function (row) {
            var placeObject = {
                title: row.name,
                description: row.description,
                owner: row.owner,
                rumor: row.destruction,
                emptySince: getEmptySinceFromString(row),
                buildingType: row.usage,
                street: row.street,
                city: row.city,
                postcode: row.zip,
                lonlat: [row.lng, row.lat],
                legacy_id: row.id,
                active: !(row.inactive === '1'),
                created: row.created_at,
                updated: row.updated_at
            };
            return getUuidForLegacyId(row.user_id, 'User')
                .then(function (userUuid) {
                    if (!userUuid) {
                        console.log('warning: skipping orphan record id %s for user id %s', row.id, row.user_id);
                    } else {
                        placeObject.user_uuid = userUuid;
                        return insertOrUpdate(placeObject, 'Location');
                    }
                })
                .then(function (location) {
                    if (location) {
                        count += 1;
                        if (count % 500 === 0) {
                            console.log('processed %d locations', count);
                        }
                    }
                })
                .catch(function (err) {
                    console.log('warning: could not insert location for legacy id %s with error: %s', userObject.legacy_id, err.message);
                });;
        }, {concurrency: 10})
        .then(function () {
            console.log('done processing %d locations', count);
        });
}

function importComments() {
    var count = 0;
    return connection.queryAsync('SELECT * FROM comments')
        .then(function (rows) {
            return rows[0];
        })
        .map(function (row) {
            var commentObject = {
                body: row.body,
                created: row.created_at,
                updated: row.updated_at
            };
            return getUuidForLegacyId(row.user_id, 'User')
                .then(function (userUuid) {
                    commentObject.author_uuid = userUuid;
                    return getUuidForLegacyId(row.place_id, 'Location');
                })
                .then(function (locationUuid) {
                    commentObject.subject_uuid = locationUuid;
                    if (!commentObject.subject_uuid || !commentObject.author_uuid) {
                        console.log('warning: skipping orphan record id %s for user id %s and place id %s', row.id, row.user_id, row.place_id);
                    } else {
                        return insertOrUpdate(commentObject, 'Comment');
                    }
                })
                .then(function (comment) {
                    if (comment) {
                        count += 1;
                        if (count % 500 === 0) {
                            console.log('processed %d comments', count);
                        }
                    }
                })
                .catch(function (err) {
                    console.log('warning: could not insert comment for legacy id %s with error: %s', row.id, err.message);
                });
        }, {concurrency: 10})
        .then(function () {
            console.log('done processing %d comments', count);
        });
}

function importPhotos() {
    var count = 0;
    return connection.queryAsync('SELECT * FROM pictures')
        .then(function (rows) {
            return rows[0];
        })
        .map(function (row) {
            var photoObject = {
                filename: row.photo_file_name.split('.')[0],
                extension: path.extname(row.photo_file_name).replace('.', ''),
                mime_type: row.photo_content_type,
                filehash: 'unknown',
                size: row.photo_file_size,
                position: row.position,
                legacy_id: row.id,
                created: row.created_at,
                updated: row.updated_at
            };
            return getUuidForLegacyId(row.user_id, 'User')
                .then(function (userUuid) {
                    photoObject.author_uuid = userUuid;
                    photoObject.creator_uuid = userUuid;
                    photoObject.publisher_uuid = userUuid;
                    photoObject.rights_holder_uuid = userUuid;
                    return getUuidForLegacyId(row.place_id, 'Location');
                })
                .then(function (locationUuid) {
                    photoObject.location_uuid = locationUuid;
                    if (!photoObject.location_uuid || !photoObject.author_uuid) {
                        console.log('warning: skipping orphan record id %s for user id %s and place id %s', row.id, row.user_id, row.place_id);
                    } else {
                        return insertOrUpdate(photoObject, 'Photo');
                    }
                })
                .then(function (photo) {
                    if (photo) {
                        count += 1;
                        if (count % 500 === 0) {
                            console.log('processed %d photos', count);
                        }
                    }
                })
                .catch(function (err) {
                    console.log('warning: could not insert photo for legacy id %s with error: %s', row.id, err.message);
                });
        }, {concurrency: 10})
        .then(function () {
            console.log('done processing %d photos', count);
        });
}

function importPosts() {
    var count = 0;
    return connection.queryAsync('SELECT * FROM posts')
        .then(function (rows) {
            return rows[0];
        })
        .map(function (row) {
            var commentObject = {
                title: row.title,
                body: row.body,
                legacy_id: row.id,
                created: row.created_at,
                updated: row.updated_at
            };
            return insertOrUpdate(commentObject, 'Post')
                .then(function (post) {
                    if (post) {
                        count += 1;
                        if (count % 500 === 0) {
                            console.log('processed %d posts', count);
                        }
                    }
                })
                .catch(function (err) {
                    console.log('warning: could not insert post for legacy id %s with error: %s', row.id, err.message);
                });
        }, {concurrency: 10})
        .then(function () {
            console.log('done processing %d posts', count);
        });
}

function importPostComments() {
    var count = 0;
    return connection.queryAsync('SELECT * FROM post_comments')
        .then(function (rows) {
            return rows[0];
        })
        .map(function (row) {
            var commentObject = {
                body: row.body,
                created: row.created_at,
                updated: row.updated_at
            };
            return getUuidForLegacyId(row.user_id, 'User')
                .then(function (userUuid) {
                    commentObject.author_uuid = userUuid;
                    return getUuidForLegacyId(row.post_id, 'Post');
                })
                .then(function (postUuid) {
                    commentObject.subject_uuid = postUuid;
                    if (!commentObject.subject_uuid || !commentObject.author_uuid) {
                        console.log('warning: skipping orphan record id %s for user id %s and place id %s', row.id, row.user_id, row.place_id);
                    } else {
                        return insertOrUpdate(commentObject, 'Comment');
                    }
                })
                .then(function (comment) {
                    if (comment) {
                        count += 1;
                        if (count % 500 === 0) {
                            console.log('processed %d post comments', count);
                        }
                    }
                })
                .catch(function (err) {
                    console.log('warning: could not insert post comment for legacy id %s with error: %s', row.id, err.message);
                });
        }, {concurrency: 10})
        .then(function () {
            console.log('done processing %d comments', count);
        });
}

function insertOrUpdate(payload, resourceName) {
    return mongoose.model(resourceName).findOne({legacy_id: payload.legacy_id})
        .then(function (existing) {
            if (!existing) {
                return mongoose.model(resourceName).create(payload);
            } else {
                return mongoose.model(resourceName).findOneAndUpdate({legacy_id: payload.legacy_id}, payload);
            }
        });
}

function getUuidForLegacyId(legacyId, resourceName) {
    return mongoose.model(resourceName).findOne({legacy_id: legacyId})
        .then(function (user) {
            if (user) {
                return user.uuid;
            }
        });
}

function getEmptySinceFromString(row) {
    var date = row.created_at;
    switch (row.since) {
        case 'mindestens 5 Jahre':
            date.setYear(date.getYear() - 5);
            break;
        case 'mindestens 3 Jahre':
            date.setYear(date.getYear() - 3);
            break;
        case 'mindestens 1 Jahr':
            date.setYear(date.getYear() - 1);
            break;
        case 'seit einem halben Jahr':
            date.setMonth(date.getMonth() - 6);
            break;
    }
    return date;
}

function tearDown(err) {
    connection.end();
    if (err) {
        console.log('failed with error: %s', err.message);
        console.log(err.stack);
    }
    console.log('done. exiting.');
    process.exit(err ? 1 : 0);
}