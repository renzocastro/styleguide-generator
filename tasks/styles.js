
// npm i -D postcss-cli autoprefixer

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
//var exec = console.log.bind(console);

function getFiles (directoryPath, fileExtension) {
  return fs.readdirSync(directoryPath)
    .map(function (file) {
      return path.join(directoryPath, file);
    })
    .filter(function (file) {
      return fs.statSync(file).isFile();
    })
    .filter(function (file) {
      return (path.extname(file) === '.' + fileExtension);
    });
}

function postcss(outputFile) {
  return 'node_modules/.bin/postcss ' + outputFile + ' --no-map --replace --use autoprefixer';
}

function main (file, isWatch) {
  var inputPath = 'src/assets/styles/';
  var outputPath = 'dist/styles/';
  var extension = 'scss';
  var inputFile;
  var outputFile;

  var cmd = [
    'sass --scss',
    '--style expanded',
    '--sourcemap=none',
    '--load-path node_modules/sass-mq'
  ].join(' ');

  if (file === '*') {
    var files = getFiles(inputPath, extension)
      .map(function (inputFile) {
        outputFile = path.join(outputPath, path.basename(inputFile, '.' + extension) + '.css');
        return inputFile + (isWatch ? ':' : ' ') + outputFile;
      });

    if (isWatch) {
      console.log('[style] watching all files...');
      exec(cmd + ' --watch ' + files.join(' '));
    } else {
      console.log('[style] BEGIN');
      files.forEach(function (file) {
        outputFile = file.split(' ')[1];
        cmd += ' ' + file;

        var basename = path.basename(outputFile, '.css');
        console.log('[style] ' + basename + '...');
        exec(cmd + ' && ' + postcss(outputFile));
      });
      console.log('[style] END');
    }
  } else {
    inputFile = path.join(inputPath, file + '.' + extension);
    outputFile = path.join(outputPath, file + '.css');

    if (isWatch) {
      console.log('[style] watching ' + file + '...');
      cmd += ' --watch ' + inputFile + ':' + outputFile;
    } else {
      console.log('[style] ' + file + '...');
      cmd += ' ' + inputFile + ' ' + outputFile;
      cmd += ' && ' + postcss(outputFile);
    }

    exec(cmd);
  }
}

module.exports = main;
