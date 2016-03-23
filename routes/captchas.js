'use strict';

var CaptchasController = require('../controllers/captchas'),
    res = new CaptchasController();

module.exports = {
    '/captchas': {
        'get': {
            controller: res.map('post', {resource: 'Captcha'}),
            scope: 'public'
        }
    },
    '/captchas/:code': {
        'get': {
            controller: res.map('get', {resource: 'Captcha'}),
            scope: 'public'
        }
    }
};