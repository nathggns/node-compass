/// <reference path="references/tsd.d.ts" />
var os = require('os');
var path = require('path');
var _ = require('lodash');


/**
* The defaults for each of our options
* @type {Options}
*/
var defaults = {
    mode: 'compress',
    css: 'stylesheets',
    sass: 'stylesheets',
    img: 'images',
    import_path: '',
    // The default project is 'public' folder in the working directory
    project: path.join(process.cwd(), 'public'),
    // On windows, the command is compass.bat and on unix it's compass
    command: os.platform() === 'win32' ? 'compass.bat' : 'compass',
    config_file: '',
    libs: [],
    cache: true,
    relative: true,
    logging: false,
    comments: false
};

/**
* Get an Options object based on the defaults, as well as provided overwrites
* @param  {Object = {}} options The provided overwrites
* @return {Options}             The default options extended with
*                               provided overwrites
*/
function ExtendOptions(overwrites) {
    if (typeof overwrites === "undefined") { overwrites = {}; }
    // Extend the defaults with passed overwrites
    var extended = _.extend(defaults, overwrites);

    // If an import_path hasn't been passed, default it the project
    if (!extended.import_path && extended.project) {
        extended.import_path = extended.project;
    }

    return extended;
}
exports.ExtendOptions = ExtendOptions;
