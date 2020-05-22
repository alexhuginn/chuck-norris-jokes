const { src, dest, watch, series, parallel } = require('gulp');

const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const gulpif = require('gulp-if');
const htmlmin = require('gulp-htmlmin');
const del = require('del');
const imagemin = require('gulp-imagemin');
var browserSync = require('browser-sync').create();
// File paths
const files = {
  scssPath: './app/scss/styles.scss',
  jsPath: './app/js/script.js',
  htmlPath: './app/index.html',
  imgPath: './app/images/**/*.+(png|jpg|jpeg|gif|svg)',
  faviconPath: './app/*.ico',
  buildCssPath: './app/css/*.min.css',
  buildJsPath: './app/js/*.min.js'
}

function scssTask() {
  return src(files.scssPath)
    .pipe(sourcemaps.init())
    .pipe(sass()).on("error", sass.logError)
    .pipe(autoprefixer())
    .pipe(cssnano())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./app/css'))
}

function jsTask() {
  return src(files.jsPath)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest('./app/js'))
}

function htmlTask() {
  return src(files.htmlPath)
    .pipe(gulpif('*.html', htmlmin({
      collapseWhitespace: true,
      removeComments: true
    })))
    .pipe(dest('./dist'))
}

function imgTask() {
  return src(files.imgPath)
    .pipe(imagemin())
    .pipe(dest('./dist/images'))
}

function copyFavicon() {
  return src(files.faviconPath)
    .pipe(dest('./dist'))
}

function copyCss() {
  return src(files.buildCssPath)
    .pipe(dest('./dist/css'))
}

function copyJs() {
  return src(files.buildJsPath)
    .pipe(dest('./dist/js'))
}

function watchTask() {
  browserSync.init({
      server: {
          baseDir: "./app"
      }
  });

  watch(
    [files.scssPath, files.jsPath, files.htmlPath],
    series(
      parallel(scssTask, jsTask),
      htmlTask
    )
  ).on('change', browserSync.reload);
}

exports.default = series(
  parallel(scssTask, jsTask),
  htmlTask,
  watchTask
);

exports.clean = del.bind(null, ['dist']);

exports.build = series(
  parallel(scssTask, jsTask, imgTask, copyFavicon, copyCss, copyJs),
  htmlTask
);
