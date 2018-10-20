const gulp = require('gulp')
const del = require('del')
const imagemin = require('gulp-imagemin')
const ts = require('gulp-typescript')
const yaml = require('gulp-yaml')
// NOTE: 开发者工具只支持JS的inline的sourcemaps
const sourcemaps = require('gulp-sourcemaps')
const replace = require('gulp-replace')
const plumber = require('gulp-plumber')
const changed = require('gulp-changed')

const path = require('path')
require('colors')

const paths = {
  img: ['src/**/*.@(png|jpg)'],
  ts: ['src/**/*.@(ts|js)', '!src/libs'],
  yaml: ['src/**/*.yaml'],
  copy: ['src/**/*.@(json|wav|mp3)', 'src/libs'],
}

function watch (glob, cb) {
  const log = (event, p) => {
    const choices = [
      'red',
      'green',
      'yellow',
      'blue',
      'magenta',
      'cyan',
    ]
    const d = new Date()
    const c = choices[Math.floor(Math.random() * choices.length)]
    console.log(`${'['[c]}${d.toLocaleTimeString()}${']'[c]}`, event, p.split(path.sep).pop())
  }

  const compile = (glob) => {
    const src = gulp.src(glob, { base: 'src' })
      .pipe(changed('dist'))
      .pipe(plumber())
    return cb(src)
      .pipe(gulp.dest('dist'))
  }

  gulp.watch(glob, {
    ignoreInitial: false,
  })
    .on('add', (p) => {
      compile(p).on('end', () => log('   add'.green, p))
    })
    .on('change', (p) => {
      compile(p).on('end', () => log('change'.yellow, p))
    })
    .on('unlink', (p) => {
      log('unlink'.red, p)
      del(p.replace('src', 'dist').replace('.ts', '.js'))
    })
}

function minifyImg () {
  return watch(paths.img, src => src.pipe(imagemin()))
}

function compileTS () {
  return watch(paths.ts, (src) => {
    return src
      .pipe(changed('dist', { extension: '.js' }))
      .pipe(replace(/import .*'[^.].*'/g, function (match) {
        const { relative } = this.file
        const layers = relative.split(path.sep).length - 1
        return match.replace('\'', '\'' + '../'.repeat(layers))
      }))
      .pipe(sourcemaps.init())
      .pipe(ts.createProject('tsconfig.json')())
      .pipe(sourcemaps.mapSources((sourcePath, file) => {
        // IDEA: 日后研究一下sourcemap的路径等知识
        // NOTE: 开发者工具上传代码时，会自动清除sourcemaps
        return file.basename
      }))
      .pipe(sourcemaps.write())
  })
}

function compileYAML () {
  return watch(paths.yaml, src => src.pipe(yaml()))
}

function copy () {
  return watch(paths.copy, src => src)
}

function clean () {
  return del('dist/*')
}

gulp.task('clean', clean)
gulp.task('copy', copy)

gulp.task('compile', gulp.parallel(
  minifyImg,
  compileTS,
  compileYAML,
  copy,
))

gulp.task('default', gulp.series(
  'clean',
  'compile',
))
