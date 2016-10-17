'use strict';

const gulp = require('gulp'),
    jshint = require('gulp-jshint');

gulp.task('lint', function() {
    return gulp.src(['./**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('default', ['lint']);