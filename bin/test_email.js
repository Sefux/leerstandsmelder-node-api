#!/usr/bin/env node

"use strict";

var Promise = require('bluebird'),
    mongoose = require('mongoose'),
    serverConfig = require('../config.json');

mongoose.Promise = Promise;

Promise.coroutine(function* () {
    if (!serverConfig) {
        throw new Error('Server has not been configured yet. Please run bin/setup.');
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
    
    // setup email data with unicode symbols
    let mailOptions = {
        from: serverConfig.get.mailer.address, // sender address
        to: 'sfuchs@projektkater.de', // list of receivers
        subject: 'Hello ✔', // Subject line
        text: 'Hello world?', // plain text body
        html: '<b>Hello world?</b>' // html body
    };
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
    

})()
.catch(function (err) {
    console.log('Error sending mail:', err.message);
    process.exit(1);
});