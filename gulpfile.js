'use strict';

const Promise = require('bluebird'),
    connect = require('connect'),
    gulp = require('gulp'),
    serveStatic = require('serve-static'),
    jshint = require('gulp-jshint'),
    open = require('gulp-open'),
    config = require('./config.json');

gulp.task('swagger', () => {
    return Promise.promisify(function (cb) {
        var app = connect();
        app.use(serveStatic('./node_modules/swagger-ui/dist', {'index': ['index.html']}));
        app.listen(config.swagger.ui_port, cb);
    })()
    .then(function () {
        let uri = `http://${config.api_server.host}:${config.swagger.ui_port}/?url=` +
            encodeURIComponent(`http://${config.api_server.host}:${config.api_server.port}/api-docs`);
        console.log('API docs accessible at', uri);
        return gulp.src(__filename)
            .pipe(open({uri: uri}));
    });
});

gulp.task('lint', () => {
    return gulp.src(['./**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('default', ['lint']);