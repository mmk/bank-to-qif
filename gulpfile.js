var gulp        = require('gulp');
var clean       = require('gulp-clean');
var csslint     = require('gulp-csslint');
var csso        = require('gulp-csso');
var imagemin    = require('gulp-imagemin');
var jshint      = require('gulp-jshint');
var greload     = require('gulp-livereload');
var uglify      = require('gulp-uglify');
var gutil       = require('gulp-util');
var cachebust   = require('gulp-cachebust')();

var express     = require('express');
var stylish     = require('jshint-stylish');
var tiny        = require('tiny-lr');
var connect     = require('connect-livereload');

var SRC             = 'src/';
var DST             = 'dist/';
var LIVERELOAD_PORT = 35729;
var EXPRESS_PORT    = 4000;
var EXPRESS_ROOT    = __dirname + '/' + SRC;

// Clear the destination folder
gulp.task('clean', function () {
    return gulp.src(DST, { read: false })
        .pipe(clean({ force: true }));
});

// Copy all application files into the 'dist' folder except user css and images
gulp.task('copy', ['clean'], function () {
    return gulp.src([SRC + '**/*', '!'+SRC +'css/**/*.css', '!'+SRC +'js/**/*.js', '!'+SRC +'img/**/*'])
        .pipe(gulp.dest(DST));
});

// Optimizes CSS files
gulp.task('css', ['clean'], function () {
    return gulp.src([SRC + 'css/main.css', SRC + 'css/normalize.css'])
        .pipe(csso())
        .pipe(cachebust.resources())
        .pipe(gulp.dest(DST + 'css'))
});

// Detect errors and potential problems in your css code
gulp.task('csslint', function () {
    return gulp.src([SRC + 'css/main.css', '!'+SRC +'css/normalize.css'])
        .pipe(csslint('.csslintrc'))
        .pipe(csslint.reporter())
});

// Detect errors and potential problems in your JavaScript code (except vendor scripts)
// You can enable or disable default JSHint options in the .jshintrc file
gulp.task('jshint', function () {
    return gulp.src([SRC + 'js/**/*.js', '!'+SRC +'js/vendor/**'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter(stylish));
});

// Uglify and copy all JavaScript
gulp.task('js', ['clean'], function () {
    return gulp.src([SRC + 'js/**/*.js'])
        .pipe(uglify())
        .pipe(gulp.dest(DST + 'js'));
});

// Minify and copy images
gulp.task('images', ['clean'], function () {
    return gulp.src(SRC + 'img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest(DST + 'img'));
});

// Inject cachebusting references into HTML
gulp.task('html', ['clean', 'css', 'js'], function () {
    return gulp.src(SRC + '*.html')
        .pipe(cachebust.references())
        .pipe(gulp.dest(DST));
});

// Start express- and live-reload-server
gulp.task('serve', function () {
    var server = express();
    server.use(connect());
    server.use(express.static(EXPRESS_ROOT));
    server.listen(EXPRESS_PORT, function() {
        gutil.log('Listening on port ' + EXPRESS_PORT);
    });

    var lr = tiny();
    lr.listen(LIVERELOAD_PORT, function (err) {
        if (err) {
            gutil.log(err);
        }
    });

    gulp.watch([SRC + '**/*.html', SRC + 'css/**/*.css', SRC + 'js/**/*.js'] , function (event) {
        gulp.src(event.path, {read: false})
            .pipe(greload(lr));
    });
});

// Runs all checks on the code
gulp.task('check', ['jshint', 'csslint']);

// The default task (called when you run `gulp`)
gulp.task('default', ['check', 'copy', 'images', 'html']);

