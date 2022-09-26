// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require("gulp");
// Importing all the Gulp-related packages we want to use
const sass = require("gulp-sass")(require("sass"));
const purgecss = require("gulp-purgecss");
const concat = require("gulp-concat");
const terser = require("gulp-terser");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const replace = require("gulp-replace");
const browsersync = require("browser-sync").create();
const htmlmin = require("gulp-htmlmin");

// File paths
const files = {
  scssSrcPath: "app/src/scss/**/*.scss",
  jsSrcPath: "app/src/js/**/*.js",
  htmlSrcPath: "app/src/**/*.html",
};

//HTML minify
// gulp.task("minify", () => {
//   return gulp
//     .src("src/*.html")
//     .pipe(htmlmin({ collapseWhitespace: true }))
//     .pipe(gulp.dest("dist"));
// });

function htmlTask() {
  return src(files.htmlSrcPath)
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest("app/dist"));
}

// Sass task: compiles the style.scss file into style.css
function scssTask() {
  return src(files.scssSrcPath, { sourcemaps: true }) // set source and turn on sourcemaps
    .pipe(sass()) // compile SCSS to CSS
    .pipe(purgecss({ content: ["app/src/**/*.html"] }))
    .pipe(postcss([autoprefixer("last 2 versions"), cssnano()])) // PostCSS plugins
    .pipe(dest("app/dist/css", { sourcemaps: "." })); // put final CSS in dist folder with sourcemap
}

// JS task: concatenates and uglifies JS files to script.js
function jsTask() {
  return src(
    [
      files.jsSrcPath,
      //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
    ],
    { sourcemaps: true }
  )
    .pipe(concat("index.js"))
    .pipe(terser())
    .pipe(dest("app/dist/js", { sourcemaps: "." }));
}

// Cachebust
function cacheBustTask() {
  var cbString = new Date().getTime();
  return src(["app/src/index.html"])
    .pipe(replace(/cb=\d+/g, "cb=" + cbString))
    .pipe(dest("."));
}

// Browsersync to spin up a local server
function browserSyncServe(cb) {
  // initializes browsersync server
  browsersync.init({
    server: {
      baseDir: ".",
    },
    notify: {
      styles: {
        top: "auto",
        bottom: "0",
      },
    },
  });
  cb();
}
function browserSyncReload(cb) {
  // reloads browsersync server
  browsersync.reload();
  cb();
}

// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
function watchTask() {
  watch(
    [files.htmlSrcPath, files.scssSrcPath, files.jsSrcPath],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(parallel(htmlTask, scssTask, jsTask), cacheBustTask)
  );
}

// Browsersync Watch task
// Watch HTML file for change and reload browsersync server
// watch SCSS and JS files for changes, run scss and js tasks simultaneously and update browsersync
function bsWatchTask() {
  watch("app/src/index.html", browserSyncReload);
  watch(
    [files.htmlSrcPath, files.scssSrcPath, files.jsSrcPath],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(
      parallel(htmlTask, scssTask, jsTask),
      cacheBustTask,
      browserSyncReload
    )
  );
}

// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
// then runs cacheBust, then watch task
exports.default = series(
  parallel(htmlTask, scssTask, jsTask),
  cacheBustTask,
  watchTask
);

// Runs all of the above but also spins up a local Browsersync server
// Run by typing in "gulp bs" on the command line
exports.bs = series(
  parallel(htmlTask, scssTask, jsTask),
  cacheBustTask,
  browserSyncServe,
  bsWatchTask
);
