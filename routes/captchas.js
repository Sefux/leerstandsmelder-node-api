'use strict';

var CaptchasController = require('../controllers/captchas'),
    res = new CaptchasController(),
    swagger = require('swagger-node-restify');

module.exports = {
    '/captchas': {
        'post': {
            controller: res.map('post', {resource: 'Captcha'}),
            scope: 'public',
            'spec': {
                "path": "/captchas",
                "description" : "Request a new Captcha image",
                "notes" : "",
                "summary" : "Create Captcha",
                "params" : [],
                "errorResponses" : [],
                "nickname" : "createCaptcha",
                "responseClass": "file"
            }
        }
    },
    '/captchas/:code': {
        'get': {
            controller: res.map('get', {resource: 'Captcha'}),
            scope: 'public',
            'spec': {
                "path": "/captchas/{code}",
                "description" : "Get existing Captcha image",
                "notes" : "Returns a PNG type image",
                "summary" : "Get Captcha",
                "params" : [swagger.pathParam("code", "Captcha code to be fetched", "string")],
                "errorResponses" : [swagger.errors.notFound('Captcha')],
                "nickname" : "fetchCaptcha",

            }
        }
    }
};