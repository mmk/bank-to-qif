var gulp        = require('gulp');
var gutil       = require('gulp-util');
var clean       = require('gulp-clean');
var csslint     = require('gulp-csslint');
var csso        = require('gulp-csso');
var imagemin    = require('gulp-imagemin');
var jshint      = require('gulp-jshint');
var uglify      = require('gulp-uglify');
var cachebust   = require('gulp-cachebust')();
var mocha       = require('gulp-mocha');
var stylish     = require('jshint-stylish');
var browserify  = require('browserify');
var source      = require('vinyl-source-stream');

var SRC  = './src/';
var TEST = './test/';
var DST  = './dist/';

// Clear the destination folder
gulp.task('clean', function () {
    return gulp.src(DST, { read: false })
        .pipe(clean({ force: true }));
});

// Copy all application files into the 'dist' folder except user css and images
gulp.task('copy', ['clean'], function () {
    //return gulp.src([SRC + '**/*', '!' + SRC + 'css/**/*.css', '!' + SRC + 'js/**/*.js', '!' + SRC + 'img/**/*'])
    return gulp.src([SRC + '**/*', '!' + SRC + 'js/**/*.js', '!' + SRC + 'img/**/*'])
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
    return gulp.src([SRC + 'css/main.css', '!' + SRC + 'css/normalize.css'])
        .pipe(csslint('.csslintrc'))
        .pipe(csslint.reporter())
});

// Detect errors and potential problems in your JavaScript code (except vendor scripts)
// You can enable or disable default JSHint options in the .jshintrc file
gulp.task('jshint', function () {
    return gulp.src([SRC + 'js/**/*.js', TEST + 'js/**/*.js', '!' + SRC + 'js/vendor/**'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter(stylish));
});

gulp.task('js', ['clean'], function () {
    return browserify(SRC + 'js/main.js', { debug: true })
        .bundle()
        .on('error', function (err) {
            gutil.log(err);
            this.end();
        })
        .pipe(source('bundle.js')) // output filename
        .pipe(gulp.dest(DST + 'js'));
});

gulp.task('other-js', ['clean'], function () {
    return gulp.src([SRC + 'js/vendor/**/*.js'])
        //.pipe(uglify())
        .pipe(gulp.dest(DST + 'js/vendor'));
});

// Minify and copy images
gulp.task('images', ['clean'], function () {
    return gulp.src(SRC + 'img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest(DST + 'img'));
});

// Inject cachebusting references into HTML
gulp.task('html', ['clean', 'css', 'other-js', 'js'], function () {
    return gulp.src(SRC + '*.html')
        .pipe(cachebust.references())
        .pipe(gulp.dest(DST));
});

// Runs all checks on the code
gulp.task('check', ['jshint', 'csslint']);

gulp.task('test', function () {
    return gulp.src(TEST + 'js/**/*.js', {read: false})
        .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('watch', function () {
    gulp.watch(
        [ SRC + "js/converter/*.js", SRC + "js/*.js", SRC + "**/*.html", SRC + "css/*.css"],
        ['default']);
});

// The default task (called when you run `gulp`)
gulp.task('default', ['check', 'copy', 'images', 'html']);

