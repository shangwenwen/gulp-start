'use strict';

var reduce = require('gulp-watchify-factor-bundle');
var browserSync = require('browser-sync').create();
var gulp = require('gulp');
var path = require('path');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var del = require('del');
var concatDir = require('gulp-concat-dir'); // 合并文件夹下相同类型文件
var sequence = require('gulp-sequence'); // 任务执行顺序
var concat = require('gulp-concat');

gulp.task('CLEAN', function() {
	return del('build')
});

gulp.task('BUILD:JS', function() {
	var basedir = path.join(__dirname, './app/_page/');
	var b = reduce.create({
		basedir: basedir
	});

	return reduce
		.src('**/*.js', {
			cwd: basedir
		})
		.pipe(reduce.bundle(b, {
			common: 'common.js'
		}))
		.pipe(buffer())
		.pipe(concatDir({
			ext: '.js'
		}))
		.pipe(uglify())
		.pipe(reduce.dest('./build/javascript/'));
});

gulp.task('BROWSERIFY:JS', function() {
	var basedir = path.join(__dirname, './app/_page/');

	var b = reduce.create({
		basedir: basedir
	});

	b.on('log', console.log.bind(console));

	b.on('update', function(ids) {
		ids.forEach(function(v) {
			console.log('bundle changed file:' + v); //记录改动的文件名
		});
	});

	return reduce
		.src('**/*.js', {
			cwd: basedir
		})
		.pipe(reduce.watch(b, {
			common: 'common.js'
		}))
		.on('bundle', function(vinylStream) {
			vinylStream
				.pipe(buffer())
				.pipe(concatDir({
					ext: '.js'
				}))
				.pipe(uglify())
				.pipe(reduce.dest('./build/javascript/'))
		});

});

// COPY:HTML
gulp.task('COPY:HTML', function() {
	return gulp
		.src('./app/_page/**/index.html')
		.pipe(concatDir({
			ext: '.html'
		}))
		.pipe(gulp.dest('./build/page/'))
		.pipe(browserSync.stream());
});

gulp.task('BUILD:SASS', function() {
	return gulp
		.src(['./app/_assets/sass/*.scss', './app/_page/**/*.scss'])
		.pipe(concatDir({
			ext: '.scss'
		}))
		.pipe(concat('all.js'))
		.pipe(gulp.dest('./build/style/'))
		.pipe(browserSync.stream());
});

// 添加本地服务，浏览器自动刷新，文件修改监听。
gulp.task('browser', function() {
	browserSync.init({
		server: {
			baseDir: './',
			directory: true,
		},
		reloadDelay: 0,
		timestamps: true,
		startPath: "./build/",
		port: 8000
	});

	gulp.watch('./app/_page/**/*.html', ['COPY:HTML']);

});



gulp.task('default', sequence('CLEAN', ['COPY:HTML', 'BUILD:JS', 'BUILD:SASS']))