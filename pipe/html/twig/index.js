// Définition du LazyPipe pour utiliser Twig
'use strict';

var path = require('path');
var lazypipe = require('lazypipe');
var gutil = require('gulp-util');
var twig = require('gulp-twig');
var data = require('gulp-data');

module.exports = function (ENV) {
  var genericDataFile = path.resolve(path.join(ENV.html['data-dir'], 'data.json'));

  // UTILS
  // ----------------------------------------------------------------------------
  function processData(file) {
    var base = file.path.replace(ENV.html['src-dir'], ENV.html['data-dir']);
    var specificDataFile = base.replace('.twig', '.json');
    var gData = {};
    var sData = {};

    try {
      gData = require(genericDataFile);
    } catch (e) {
      gutil.log(gutil.colors.yellow('WARN:'),
        'Unable to find data from',
        genericDataFile.replace(path.resolve('.'), '').slice(1)
      );
    }

    try {
      sData = require(specificDataFile);
    } catch (e) {
      gutil.log(gutil.colors.yellow('WARN:'),
        'Unable to find data from',
        specificDataFile.replace(path.resolve('.'), '').slice(1)
      );
    }

    return Object.assign({}, gData, sData);
  }

  function load(folderPath) {
    folderPath = path.resolve(__dirname, folderPath);
    return function (Twig) {
      require('fs').readdirSync(folderPath).forEach(function(file) {
        require(path.join(folderPath, file))(Twig);
      });
    }
  }

  // TWIG CONFIGURATION
  // ----------------------------------------------------------------------------
  var CONF = {
    errorLogToConsole: true,
    onError: function (error) {
      gutil.log(gutil.colors.red('ERROR:'), error.plugin);

      if (error.stack) {
        error.stack.split('\n').forEach(function (line) {
          gutil.log(gutil.colors.red('STACK:'), line);
        });
      } else {
        gutil.log(gutil.colors.red('ERROR:'), error.message);
      }

      this.emit('end');
    }
  };

  var val = load('./extends');
  if (val) {
    CONF.extend = val;
  }

  var lazystream = lazypipe()
    .pipe(data, processData)
    .pipe(twig, CONF);

  return lazystream();
};
