var os    = require('os');
var spawn = require('child_process').spawn;
var path  = require('path');
var fs    = require('fs');
var _     = require('lodash');
var Q     = require('q');

/**
 * An exception that is thrown when the wrong arguments are passed
 */
function InvalidArgumentException(message) {
  this.message = message;
  this.stack   = (new Error()).stack;
}

InvalidArgumentException.prototype = new Error();

_.extend(InvalidArgumentException.prototype, {
  name : 'InvalidArgumentException'
});

/**
 * Handle filtering requests to only take requests for CSS files
 */
function filterRequest(req) {

  if (typeof req !== 'object' || _.isArray(req)) {
    throw new InvalidArgumentException('req should be an object');
  }

  if (typeof req.path !== 'string') {
    throw new InvalidArgumentException(
      'req should have path property, which is of type string'
    );
  }

  return _.last(req.path.split('.')) === 'css';
}

/**
 * Handles building a flags string
 */
function buildFlagsString(opts) {

  // Test that we're passing an object of options, if we've passed anything
  if (typeof opts !== 'undefined' && typeof opts !== 'object' || _.isArray(opts)) {
    throw new InvalidArgumentException('opts should be an object');
  }

  // If we've not passed anything, make our options a blank dictionairy
  if (typeof opts === 'undefined') {
    opts = {};
  }

  // Make sure that libs is an array
  if (typeof opts.libs !== 'undefined' && !_.isArray(opts.libs)) {
    throw new InvalidArgumentException('libs should be of type array');
  }

  var flags = ['compile'];

  if (opts.config_file) {
    flags.push('-c', opts.config_file);
  }

  if ('comments' in opts && !opts.comments) {
    flags.push('--no-line-comments');
  }

  if ('relative' in opts && opts.relative) {
    flags.push('--relative-assets');
  }

  if ('mode' in opts) {
    flags.push('--output-style', opts.mode);
  }

  if ('css' in opts) {
    flags.push('--css-dir', opts.css);
  }

  if ('sass' in opts) {
    flags.push('--sass-dir', opts.sass);  
  }

  if ('img' in opts) {
    flags.push('--images-dir', opts.img);
  }

  if ('import_path' in opts) {
    flags.push('-I', opts.import_path);
  }

  // Add each of our libs to the flags
  if ('libs' in opts) {
    opts.libs.forEach(function(lib){
      flags.push('-r', lib);
    });
  }

  return flags;
}

/**
 * Handles logging compass output
 */
function handleLogging(compass) {
  compass.stdout.setEncoding('utf8');
  compass.stdout.on('data', function (data) {
    console.log(data);
  });

  compass.stderr.setEncoding('utf8');
  compass.stderr.on('data', function (data) {
    if (!data.match(/^\u001b\[\d+m$/)) {
      console.error('\u001b[31mstderr:\u001b[0m ' + data);
    }
  });
}

/**
 * Just a dictionary for our default options
 * @type {Object}
 */
var defaults = {

  // The type of output mode to use
  mode             : 'compress',

  // The name of the folder to place css files
  css              : 'stylesheets',

  // The name of the folder to find sass files
  sass             : 'stylesheets',

  // The name of the folder to find images
  img              : 'images',

  // Should we cache the output
  cache            : true,

  // Should assets be found relatively?
  relative         : true,

  // Should we output logging information to the console?
  logging          : false,

  // Path to find the compass config file?
  config_file      : false,

  // Should comments be included in our output?
  comments         : false,

  // Function used to filter requests so that we only handle CSS files
  filterRequest    : filterRequest,

  // Handle building flags
  buildFlagsString : buildFlagsString,

  // Handling logging
  handleLogging    : handleLogging,

  // Names of the libraries to include
  libs             : [],

  // Where to find imports
  import_path      : path.join(process.cwd(), 'public'),

  // Path to the root of the project
  project          : path.join(process.cwd(), 'public'),

  // The command to execute for compass
  command          : os.platform() === 'win32' ? 'compass.bat' : 'compass'
};

/**
 * Call with your configuration options to get a middleware function
 */
module.exports = function(opts) {

  // If we've been passed the wrong type of arguments, throw an error
  if (
    (typeof opts !== 'undefined' && typeof opts !== 'object') ||
    _.isArray(opts)
  ) {
    throw new InvalidArgumentException('opts must be of type object');
  }
  // Apply our default options to our passed options
  opts = _.extend({}, defaults, typeof opts === 'object' ? opts : {});

  // Make sure filterRequest  is invokable
  if (typeof opts.filterRequest  !== 'function') {
    throw new InvalidArgumentException('filterRequests must be invokable');
  }

  /**
   * Handles requests
   */
  return function(req, res, next) {
    // Make sure we're handling a CSS files
    if (!opts.filterRequest(req)) {
      return next();
    }

    // Build our flags string
    var flags = opts.buildFlagsString(opts);

    // Spawn our command
    var compass = spawn(opts.command, flags, { cwd : opts.project });

    // Handle logging
    if (opts.logging) {
      opts.handleLogging(compass);
    }

    // Continue to next middleware when compass is done
    // @todo Handle bad exit codes 
    compass.on('exit', function(code) {
      return next();
    });
  };
};


_.extend(module.exports, {
  InvalidArgumentException : InvalidArgumentException,
  defaults                 : defaults,
  buildFlagsString         : buildFlagsString,
  filterRequest            : filterRequest,
  handleLogging            : handleLogging
});