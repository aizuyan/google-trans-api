const typescript = require('gulp-typescript')
const rename = require('gulp-rename')
const gulp = require('gulp')

gulp.task('es5-rely', () => {
  return gulp.src([
    'src/**/*.ts',
    '!src/index.ts'
  ])
    .pipe(typescript({
      target: 'es5',
      module: 'commonjs',
    }))
    .pipe(gulp.dest('dist'))
})

gulp.task('es5', gulp.series('es5-rely', () => {
  return gulp.src('src/index.ts')
    .pipe(typescript({
      target: 'es5',
      module: 'commonjs',
    }))
    .pipe(gulp.dest('dist'))
}))

gulp.task('es6-rely', () => {
  return gulp.src([
    'src/**/*.ts',
    '!src/index.ts'
  ])
    .pipe(typescript({
      target: 'ESNext',
      module: 'ESNext',
    }))
    .pipe(gulp.dest('dist/es6'))
})

gulp.task('es6', gulp.series('es6-rely',()  => {
  return gulp.src('src/index.ts')
    .pipe(typescript({
      target: 'ESNext',
      module: 'ESNext',
    }))
    .pipe(rename({
      extname: '.es6.js'
    }))
    .pipe(gulp.dest('dist/es6'))
}))

gulp.task('default', gulp.parallel('es5', 'es6'))
