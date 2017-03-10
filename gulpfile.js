const gulp = require('gulp')
const path = require('path')

let compileCSS = function (input) {
  const less = require('gulp-less')
  const sourcemaps = require('gulp-sourcemaps')

  return input
  .pipe(sourcemaps.init())
  .pipe(less({
    paths: [ path.join(__dirname, 'css') ]
  }))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('styles/'))
}

gulp.task('default', function () {
  let watch = require('gulp-watch')

  return watch('css/**/*.less', function () {
    compileCSS(gulp.src('css/**/*.less'))
  })
})

gulp.task('build', function () {
  return compileCSS(gulp.src('css/**/*.less'))
})
