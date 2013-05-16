var spawn = require('child_process').spawn,
    path = require('path'),
    defaults = {
      'mode': 'compress',
      'comments': false,
      'relative': true,
      'img': 'images',
      'css': 'stylesheets',
      'sass': 'stylesheets',
      'project': path.join(process.cwd(), 'public'),
      'cache': true,
      'libs': [],
      'config': false,
      'debug': false
    },
    fs = require('fs');

module.exports = exports = function(opts) {
  opts = opts || {};
  for (var key in defaults) {
    if (opts[key] === undefined) {
      opts[key] = defaults[key];
    }
  }

  var cache = {};
  var sassCount = null;

  var getCSSFunction = function(file, done) {
    return function(err, data) {
      cache[file] = {
        sass: null,
        mtime: null
      };

      if (done) done();
    };
  };

  var getSassFunction = function(fullPath, cssPath, done) {
    return function(err, stats) {
      cache[cssPath].sass = fullPath;
      cache[cssPath].mtime = stats.mtime.getTime();

      if (done) done();
    };
  };

  var last = function(arr) {
    return arr[arr.length - 1];
  };

  var fillInSassFiles = function() {
    fs.readdir(path.join(opts.project, opts.sass), function(err, files) {

      var need = 0;
      var done = 0;

      sassCount = 0;

      var doneFunction = function() {
        done++;
        sassCount++;
      };

      for (var key in files) {
        var file = files[key];
        var parts = file.split('.');

        if (['scss', 'sass'].indexOf(last(parts)) === -1) continue;

        var name = last(parts[0].split('/'));
        var fullPath = path.join(path.join(opts.project, opts.sass), file);
        var cssPath = path.join(path.join(opts.project, opts.css), name) + '.css';

        if (!cache[cssPath]) continue;

        need++;

        fs.stat(fullPath, getSassFunction(fullPath, cssPath, doneFunction));
      }

      (function waiting() {
        if (done < need) return setTimeout(waiting, 1);
      })();
    });
  };

  return function(req, res, next) {

    if (last(req.path.split('.')) !== 'css') return next();

    var changes = false;
    var go = false;
    var exit = false;

    if (!opts.cache) {
      go = true;
    } else {
      var getStatFunction = function(key, item, done) {
        return function(err, stats) {

          if (err) {
            delete cache[key];
          } else if (item.mtime !== stats.mtime.getTime()) {
            changes = true;
          }

          if (done) done();
        };
      };

      fs.readdir(path.join(opts.project, opts.sass), function(err, files) {

        var count = 0;

        if (sassCount !== null) {

          for (var key in files) {
            var file = files[key];

            if (['sass', 'scss'].indexOf(last(file.split('.'))) !== -1) count++;
          }
        }

        if (count !== sassCount) {
          changes = true;
          go = true;
        } else {
          var need = Object.keys(cache).length;
          var done = 0;

          var doneFunction = function() {
            done++;
          };

          for (var cacheKey in cache) {
            var item = cache[cacheKey];

            try {
              fs.stat(item.sass, getStatFunction(cacheKey, item, doneFunction));
            } catch (e) {
              delete cache[cacheKey];
              doneFunction();
            }
          }

          (function waiting() {
            if (done < need) return setTimeout(waiting, 1);

            if (!changes) {
              exit = true;
            } else {
              go = true;
            }
          })();

        }
      });
    }

    (function waitingForGo() {
      if (!go) {
        if (!exit) {
          return setTimeout(waitingForGo, 1);
        } else {
          opts.debug && console.log("Compass CSS From Cache");
          return next();
        }
      }

      cache = {};
	  
	  var args = ['compile'];
	  
	  if(opts.config_file){
		  args.push('-c', opts.config_file);
	  }else{
		  args.push('-s', opts.mode);
		  args.push('--css-dir', opts.css);
		  args.push('--sass-dir', opts.sass);
		  args.push('--images-dir', opts.img);
		  if(Array.isArray(opts.libs) && opts.libs.length){
			  opts.libs.forEach(function(lib){
				  args.push('-r', lib);
			  });
		  }
		  !opts.comments && (args.push("--no-line-comments"));
		  opts.relative && (args.push("--relative-assets"));
	  }
	  
	  var compass = spawn('compass', args, {cwd: opts.project});
	  
	  if(opts.debug){
		console.log("(" + opts.project + ")",  "compass", args.join(" "));
		compass.stdout.on("data", function(data){process.stdout.write((new Buffer(data)).toString("utf8"));});
		compass.stderr.on("data", function(data){process.stdout.write((new Buffer(data)).toString("utf8"));});
	  }
	  

      if (opts.cache) {
        fs.readdir(path.join(opts.project, opts.css), function(err, files) {

          var done = 0;

          var doneFunction = function() {
            done++;
          };

          var need = 0;

          for (var key in files) {
            var file = files[key];

            if (last(file.split('.')) === 'css') {
              need++;
              var full = path.join(path.join(opts.project, opts.sass), file);

              fs.readFile(full, getCSSFunction(full, doneFunction));
            }
          }

          (function waiting() {
            if (done < need) return setTimeout(waiting, 1);

            fillInSassFiles();
          })();
        });
      }

      compass.on('exit', function(code) {
        return next();
      });
    })();
  };
};