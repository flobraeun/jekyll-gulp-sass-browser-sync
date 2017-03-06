var gulp         = require('gulp');
var browserSync  = require('browser-sync');
var sass         = require('gulp-sass');
var autoprefixer = require('autoprefixer');
var cp           = require('child_process');
var runSequence  = require('run-sequence');
var concat       = require('gulp-concat');
var sourcemaps   = require('gulp-sourcemaps');
var uglify       = require('gulp-uglify');
var postcss      = require('gulp-postcss');
var cssnano      = require('gulp-cssnano');

var jekyll       = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';

var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build',
    sassError: 'Error in SASS'
};

/**
 * Input folders for assets
 */
var input = {
    'sass': '_sass/**/*.scss',
    'javascript': '_javascript/**/*.js',
    'vendorjs': 'assets/javascript/libs/**/*.js'
};

/**
 * Output folders for assets
 */
var output = {
    'stylesheets': '_site/assets/css',
    'jekyllStylesheets': 'assets/css',
    'javascript': '_site/assets/js',
    'jekyllJavascript': 'assets/js'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['build'], function () {
    browserSync.reload();
});

/**
 * Wait for build, then launch the Server
 */
gulp.task('browser-sync', ['build'], function () {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});
/**
 * Compile and minify files from _scss into both _site/assets/css (for live injecting) and assets/css (for future jekyll builds)
 */
gulp.task('build-css', function () {
    return gulp.src(input.sass)
        .pipe(sourcemaps.init())
        .pipe(sass({
            onError: browserSync.notify(messages.sassError)
        })).on('error', sass.logError)
        .pipe(postcss([autoprefixer({
            browsers: ['last 15 versions', '> 1%', 'ie 8', 'ie 7'],
            cascade: true
        })]))
        .pipe(cssnano())
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: '/_sass'
        }))
        .pipe(gulp.dest(output.jekyllStylesheets))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest(output.stylesheets));
});

/**
 * Minify and optionally combine files from _javascript into both _site/assets/js (for live injecting) and assets/js (for future jekyll builds)
 */
gulp.task('build-js', function () {
    return gulp.src(input.javascript)
        .pipe(sourcemaps.init())
        //.pipe(concat('scripts.js'))  // Uncomment to combine all .js-files to scripts.js
        .pipe(uglify())
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: 'source'
        }))
        .pipe(gulp.dest(output.jekyllJavascript))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest(output.javascript));
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('_sass/*.scss', ['build-css']);
    gulp.watch('_javascript/*.js', ['build-js']);
    gulp.watch(['*.html', '*.md', '*.markdown', '_layouts/*.html', '_posts/*'], ['jekyll-rebuild']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);
gulp.task('build', function (done) {
    runSequence('jekyll-build', ['build-css', 'build-js'],
        function () {
            done();
        });
});