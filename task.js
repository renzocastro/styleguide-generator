#!/usr/bin/env node
var args = require('yargs').argv;
var task = args._[0];
var file = args._[1] || args.f || args.file || '*';
var isWatch = (args.watch || args.w);

var tasks = {
  s: 'styles',
  styles: 'styles',
  j: 'scripts',
  scripts: 'scripts',
  p: 'pages',
  pages: 'pages'
};

var command = require('./tasks/' + tasks[task]);
command(file, isWatch);
