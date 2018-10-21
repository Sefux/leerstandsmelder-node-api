'use strict';

var mongoose = require('mongoose'),
    restifyErrors = require('restify-errors'),
    Promise = require('bluebird'),
    rHandler = require('../lib/util/response-handlers'),
    acl = require('../lib/auth/acl-manager'),
    CommonController = require('./common');

class UsersController extends CommonController {
    constructor() {
        super();

        function deleteProtected(req) {
            delete req.body.single_access_token;
            delete req.body.failed_logins;
            delete req.body.crypted_password;
            delete req.body.password_salt;
            delete req.body.legacy_id;
        }

        function updateUUID(req) {
            if (req.params.uuid === "me" && req.user && req.user.scopes.indexOf("admin") < 0 ) {
                req.params.uuid = req.user.uuid;
            }
            return Promise.resolve();
        }

        function preHandler(req) {
            updateUUID(req);
            if (req.user.uuid !== req.params.uuid && req.user.scopes.indexOf("admin") < 0) {
                throw restifyErrors.makeErrFromCode(403);
            }
            return Promise.resolve();
        }

        this.coroutines.getResource.pre = updateUUID;
        this.coroutines.getResource.main = Promise.coroutine(function* (req, res, next, config) {
            var selectAttributes = "uuid nickname";

            if (req.user && req.user.uuid === req.params.uuid) {
                selectAttributes = "uuid nickname email message_me notify";
            }
            if (req.api_key && req.api_key.scopes && req.api_key.scopes.indexOf("admin") > -1 ) {
              selectAttributes = "uuid nickname confirmed blocked email message_me notify share_email created updated last_login failed_logins";
            }

            var q = mongoose.model(config.resource)
                .findOne({$or: [{uuid: req.params.uuid},{nickname: {$regex: req.params.uuid, $options: "i"}}], confirmed: true, blocked: false})
                .select(selectAttributes);
            var result = yield q.exec();


            //TODO: as admin i want to see/edited user rights/ACL
            if (req.api_key && req.api_key.scopes && req.api_key.scopes.indexOf("admin") > -1 ) {
                result = result.toObject();
                result.api_keys = yield mongoose.model("ApiKey").find({user_uuid: result.uuid, active: true})
                    .select("created updated scopes").exec();
            }



            if (result) {
                rHandler.handleDataResponse(result, 200, res, next);
            } else {
                rHandler.handleErrorResponse(restifyErrors.makeErrFromCode(404), res, next);
            }
        });
        this.coroutines.findResource.main = Promise.coroutine(function* (req, res, next, config) {
                if (req.params.uuid === "me" && req.user) {
                    req.params.uuid = req.user.uuid;
                }
                let query = require("../lib/util/query-mapping")({}, req, config);

                let paths = mongoose.model(config.resource).schema.paths;
                if (paths.hasOwnProperty("hidden")) {
                    query.hidden = false;
                }

                let limit = Math.abs(parseInt(req.query.limit) || 5),
                    skip = Math.abs(parseInt(req.query.skip) || 0),
                    q = mongoose.model(config.resource).find(query);

                q = config.select ? q.select(config.select) : q;
                q = req.query.skip ? q.skip(skip) : q;
                q = req.query.limit ? q.limit(limit) : q;
                //q = req.query.sort ? q.sort(req.query.sort) : q;


                var data = {page: Math.floor(skip / limit), pagesize: limit},
                    results = yield q.exec();
                data.total = yield mongoose.model(config.resource).count(q._conditions);

                data.results = yield Promise.map(results, Promise.coroutine(function* (result) {
                    result = result.toObject();
                    result.api_keys = yield mongoose.model("ApiKey").find({user_uuid: result.uuid})
                        .select("created updated scopes").exec();
                    return result;
                }));

                rHandler.handleDataResponse(data, 200, res, next);
            });
        this.coroutines.findResource.pre = Promise.resolve;


        this.coroutines.postResource.main = Promise.coroutine(function* (req, res, next) {
            deleteProtected(req);
            delete req.body.confirmed;
            delete req.body.blocked;
            delete req.body.scopes;


            var user = yield mongoose.model("User").create(req.body);
            yield acl.setAclEntry(
                "/users/" + user.uuid,
                [user.uuid, "admin"],
                ["get", "put", "delete"]
            );
            yield acl.setAclEntry("/users/" + user.uuid, ["user"], ["get"]);
            yield acl.setAclEntry("/users/me", [user.uuid], ["get", "put", "delete"]);
            if (!req.query || !req.query.hasOwnProperty("noconfirm")) {
                //yield workers.sendConfirmationMail(user.uuid);
                user.sendConfirmationMail();
            }

            return rHandler.handleDataResponse(user, 201, res, next);
        });

        this.coroutines.putResource.pre = preHandler;
        this.coroutines.putResource.main = Promise.coroutine(function* (req, res, next) {
            var user = yield mongoose.model("User").findOne({uuid: req.params.uuid, confirmed: true, blocked: false});
            deleteProtected(req);
            if (!req.api_key || !req.api_key.scopes || (req.api_key.scopes.indexOf("admin") === -1 && req.api_key.scopes.indexOf("editor") === -1)) {
                delete req.body.confirmed;
                delete req.body.blocked;
                delete req.body.scopes;
            }

            if (req.body.password) {
                user.password = req.body.password;
                yield user.save();
                delete req.body.password;
            }
            for (var key in req.body) {
                //TODO: use model.path, otherwise model changes will not work
                //if (user[key]) {
                    user[key] = req.body[key];
                //}
            }
            yield user.save();

            //only admin users can do this
            if (req.api_key && req.api_key.scopes && req.api_key.scopes.indexOf("admin") > -1 ) {
                //get user scopes
                let userApiKey = yield mongoose.model("ApiKey")
                    .findOne({user_uuid: req.params.uuid, active: true})
                    .sort("-created").exec();

                //are scopes avaiable inmodel?
                if(!userApiKey) {
                  userApiKey = yield mongoose.model("ApiKey").create({user_uuid: req.params.uuid, active: true});
                }
                //find scope difference
                var removeDifference = userApiKey.scopes.filter(function(scope) {
                  for (var i in req.body.scopes) {
                    if (scope === req.body.scopes[i]) { return false; }
                  }
                  return true;
                });
                var difference = req.body.scopes.filter(function(scope) {
                  for (var x in userApiKey.scopes) {
                    if (scope === userApiKey.scopes[x]) { return false; }
                  }
                  return true;
                });
                if(req.body.scopes && (difference.length > 0 || removeDifference.length > 0 )) {
                    //update user scopes
                    if (userApiKey) {
                        //remove scopes
                        for (var y in removeDifference) {
                            if (userApiKey.scopes.indexOf(removeDifference[y])) {
                                userApiKey.scopes.splice( userApiKey.scopes.indexOf(removeDifference[y]), 1 );
                                userApiKey.save();
                            }
                        }
                        //add scopes
                        for (var z in difference) {
                            if (userApiKey.scopes.indexOf(difference[z]) === -1) {
                                userApiKey.scopes.push(difference[z]);
                                userApiKey.save();
                            }
                        }
                    }

                }
            }
            rHandler.handleDataResponse(user, 200, res, next);
        });

        this.coroutines.resetUserResource = {
            main: Promise.coroutine(function* (req, res, next) {
                var user = yield mongoose.model("User").findOne({email: req.body.email, blocked: false}).exec();
                if(user) {
                  //yield workers.sendResetMail(user.uuid);
                  user.requestPasswordReset();
                  rHandler.handleDataResponse(user, 201, res, next);
                } else {
                  rHandler.handleErrorResponse(new restifyErrors.makeErrFromCode(500), res, next);
                }
            }),
            pre: Promise.resolve
        };

        this.coroutines.deleteResource.pre = preHandler;
    }
}

module.exports = UsersController;
