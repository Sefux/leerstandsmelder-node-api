#!/usr/bin/env node

"use strict";

var Promise = require('bluebird'),
    mongoose = require('mongoose'),
    nodemailer = require('nodemailer'),
    serverConfig = require('../config.json');

mongoose.Promise = Promise;

Promise.coroutine(function* () {
    if (!serverConfig) {
        throw new Error('Server has not been configured yet. Please run bin/setup.');
    }
    var transport = nodemailer.createTransport({
        host: serverConfig.mailer.host,
        port: serverConfig.mailer.port,
        secure: serverConfig.mailer.secure,
        auth: {
            user: serverConfig.mailer.user,
            pass: serverConfig.mailer.pass
        },
        tls: {
            rejectUnauthorized: serverConfig.mailer.validateSSL
        }
    });
    
    // setup email data with unicode symbols
    let mailOptions = {
        from: serverConfig.mailer.address, // sender address
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