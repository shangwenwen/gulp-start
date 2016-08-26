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

var imagemin = require('gulp-imagemin'); // 压缩图片

var sass = require('gulp-sass');
var base64 = require('gulp-css-base64'); // 生成 base64 图片文件
var cssmin = require('gulp-cssmin'); // 压缩样式文件

var handleErrors = require('./gulp/util/handleErrors.js');

// 添加本地服务，浏览器自动刷新，文件修改监听。
gulp.task('BROWSERSYNC', function() {
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
	gulp.watch('./app/_assets/images/**/*.{jpg,png,gif,svg}', ['COPY:IMAGES']);
	gulp.watch(['./app/_assets/sass/*.scss', './app/_page/**/*.scss'], ['BUILD:SASS']);
	gulp.watch(['./node_modules/font-awesome/fonts/*.*', './app/_assets/fonts/*.*'], ['COPY:FONTS']);

});

// CLEAN
gulp.task('CLEAN', function() {
	return del('build')
});

// BUILD JS
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

// BROWSERIFY JS
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
				.on('error', handleErrors)
				.pipe(buffer())
				.pipe(concatDir({
					ext: '.js'
				}))
				.pipe(reduce.dest('./build/javascript/'))
				.pipe(browserSync.stream());
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

// COPY:IMAGES
gulp.task('COPY:IMAGES', function() {
	return gulp
		.src('./app/_assets/images/**/*.{jpg,png,gif,svg}')
		.pipe(imagemin())
		.pipe(gulp.dest('./build/images/'))
		.pipe(browserSync.stream());
});

// BUILD SASS
gulp.task('BUILD:SASS', function() {
	return gulp
		.src(['./app/_assets/sass/*.scss', './app/_page/**/*.scss'])
		.pipe(sass.sync().on('error', sass.logError))
		.pipe(base64({
			baseDir: './',
			maxWeightResource: 20 * 1024,
			extensionsAllowed: ['.gif', '.jpg', '.png']
		}))
		.pipe(concatDir({
			ext: '.scss'
		}))
		.pipe(concat('all.css'))
		.pipe(cssmin())
		.pipe(gulp.dest('./build/style/'))
		.pipe(browserSync.stream());
});

// 拷贝字体
gulp.task('COPY:FONTS', function() {
	return gulp.src(['./node_modules/font-awesome/fonts/*.*', './app/_assets/fonts/*.*'])
		.pipe(gulp.dest('./build/fonts/'))
		.pipe(browserSync.stream());
});



// prod
gulp.task('default', sequence('CLEAN', ['COPY:HTML', 'BUILD:JS', 'BUILD:SASS', 'COPY:IMAGES', 'COPY:FONTS']))

// dev
gulp.task('dev', sequence('CLEAN', 'BROWSERSYNC', ['COPY:HTML', 'BROWSERIFY:JS', 'BUILD:SASS', 'COPY:IMAGES', 'COPY:FONTS']))