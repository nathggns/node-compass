var os = require('os');
var path = require('path');
var _ = require('lodash');


var defaults = {
    mode: 'compress',
    css: 'stylesheets',
    sass: 'stylesheets',
    img: 'images',
    import_path: '',
    project: path.join(process.cwd(), 'public'),
    command: os.platform() === 'win32' ? 'compass.bat' : 'compass',
    config_file: '',
    libs: [],
    cache: true,
    relative: true,
    logging: false,
    comments: false
};

function ExtendOptions(overwrites) {
    if (typeof overwrites === "undefined") { overwrites = {}; }
    var extended = _.extend(defaults, overwrites);

    if (!extended.import_path && extended.project) {
        extended.import_path = extended.project;
    }

    return extended;
}
exports.ExtendOptions = ExtendOptions;
