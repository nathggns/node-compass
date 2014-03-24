import os   = require('os');
import path = require('path');
import _    = require('lodash');

/**
 * The interface we'll use to represent our options throughout the system
 */
export interface Options extends Object {

  [index:string]: any;

  /**
   * The type of output mode to use
   * @type {string}
   */
  mode        : string;

  /**
   * The name of the folder to place css files
   * @type {string}
   */
  css         : string;

  /**
   * The name of the folder to find sass files
   * @type {string}
   */
  sass        : string;

  /**
   * The name of the folder to find images
   * @type {string}
   */
  img         : string;

  /**
   * Absolute path to the compass project
   * @type {string}
   */
  project     : string;

  /**
   * Absolute location to find compass imports (use '' to default to project)
   * @type {string}
   */
  import_path : string;

  /**
   * The command to execute for compass
   * @type {string}
   */
  command     : string;

  /**
   * Path to find the compass config file?
   * @type {string}
   */
  config_file : string;

  /**
   * Names of the libraries to include
   * @type {string}
   */
  libs        : string[];

  /**
   * Should we cache the output
   * @type {string}
   */
  cache       : boolean;

  /**
   * Should assets be found relatively?
   * @type {string}
   */
  relative    : boolean;

  /**
   * Should we output logging information to the console?
   * @type {string}
   */
  logging     : boolean;

  /**
   * Should comments be included in our output?
   * @type {string}
   */
  comments    : boolean;
}

/**
 * The defaults for each of our options
 * @type {Options}
 */
var defaults : Options = {
  mode             : 'compress',
  css              : 'stylesheets',
  sass             : 'stylesheets',
  img              : 'images',
  import_path      : '',

  // The default project is 'public' folder in the working directory
  project          : path.join(process.cwd(), 'public'),

  // On windows, the command is compass.bat and on unix it's compass
  command          : os.platform() === 'win32' ? 'compass.bat' : 'compass',

  config_file      : '',
  libs             : [],
  cache            : true,
  relative         : true,
  logging          : false,
  comments         : false
};

/**
 * Get an Options object based on the defaults, as well as provided overwrites
 * @param  {Object = {}} options The provided overwrites
 * @return {Options}             The default options extended with
 *                               provided overwrites
 */
export function ExtendOptions(overwrites : Object = {}) : Options {
  // Extend the defaults with passed overwrites
  var extended : Options = <Options> _.extend(defaults, overwrites);

  // If an import_path hasn't been passed, default it the project
  if (!extended.import_path && extended.project) {
    extended.import_path = extended.project;
  }

  return extended;
}