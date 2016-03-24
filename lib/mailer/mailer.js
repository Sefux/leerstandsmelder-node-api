'use strict';

var sendMail = function (config) {
    var fs = require('fs'),
        path = require('path'),
        nodemailer = require('nodemailer'),
        Promise = require('bluebird'),
        serverConfig = require('../config');

    if (!serverConfig.get || !serverConfig.get.mailer) {
        return Promise.resolve();
    }

    var transport = nodemailer.createTransport({
        host: serverConfig.get.mailer.host,
        port: serverConfig.get.mailer.port,
        secure: serverConfig.get.mailer.secure,
        auth: {
            user: serverConfig.get.mailer.user,
            pass: serverConfig.get.mailer.pass
        },
        tls: {
            rejectUnauthorized: serverConfig.get.mailer.validateSSL
        }
    });

    Promise.promisifyAll(fs);
    Promise.promisifyAll(transport);

    return fs.readFileAsync(path.resolve(__dirname, 'mails/' + config.template + '.' + config.lang + '.txt'))
        .then(function (data) {
            var processedBody = data.toString();
            for (var i = 0; i < config.substitutions.length; i += 1) {
                processedBody = processedBody.replace(config.substitutions[i].key, config.substitutions[i].value);
            }
            return transport.sendMailAsync({
                from: serverConfig.get.mailer.address,
                to: config.recipient,
                subject: config.subject,
                text: processedBody
            });
        })
        .catch(function (err) {
            console.log(`Failed to send EMail: ${err.message}`);
        });
};

var getBaseUrl = function () {
    return require('../config').get.frontend.base_url;
};

module.exports.sendConfirmationRequest = function (user) {
    return sendMail({
        recipient: user.email,
        subject: 'Bitte bestätige Deine E-Mail bei Leerstandsmelder.de',
        template: 'confirm_email',
        lang: 'en',
        substitutions: [
            {key: '!CONFIRM_URL!', value: getBaseUrl() + '/users/confirm/' + user.single_access_token}
        ]
    });
};

module.exports.sendResetPassword = function (user) {
    return sendMail({
        recipient: user.email,
        subject: 'Dein Passwort bei Leerstandsmelder.de',
        template: 'reset_email',
        lang: 'en',
        substitutions: [
            {key: '!RESET_URL!', value: getBaseUrl() + '/users/reset/' + user.single_access_token}
        ]
    });
};