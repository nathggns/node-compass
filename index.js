var spawn = require('child_process').spawn,
    path = require('path'),
    defaults = {
      'mode': 'compress',
      'comments': false,
      'relative': true,
      'css': 'stylesheets',
      'sass': 'stylesheets',
      'project': path.join(process.cwd(), 'public')
    };

module.exports = exports = function(opts) {
  opts = opts || {};
  for (var key in defaults) {
    if (opts[key] === undefined) {
      opts[key] = defaults[key];
    }
  }

  return function(req, res, next) {
    var compass = spawn(
      'compass',
      [
        'compile',
        opts.comments ? '' : '--no-line-comments',
        opts.relative ? '--relative-assets' : '',
        '-s', opts.mode,
        '--css-dir', opts.css,
        '--sass-dir', opts.sass
      ],
      {
        cwd: opts.project
      }
    );

    compass.on('exit', function(code) {
      return next();
    });
  };
};