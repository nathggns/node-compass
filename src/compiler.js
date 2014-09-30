/// <reference path="references/tsd.d.ts" />
var Q = require('q');
var child_process = require('child_process');
var _ = require('lodash');

var path = require('path');

var Logger = require('./logger');
var util = require('./util');
var Files = require('./files');

/**
* A map of boolean flags to their name in Options.Options
*/
var booleanFlags = {
    '--no-line-comments': 'comments',
    '--relative-assets': 'relative'
};

/**
* A map of string flags to their name in Options.Options
* @type {Object}
*/
var stringFlags = {
    '-c': 'config_file',
    '-I': 'import_path',
    '--output-style': 'mode',
    '--css-dir': 'css',
    '--sass-dir': 'sass',
    '--images-dir': 'img'
};

/**
* Compile a Compass Project
*/
var CompassCompiler = (function () {
    /**
    * Configures the compiler with the passed options
    */
    function CompassCompiler(options, logger) {
        if (typeof logger === "undefined") { logger = null; }
        /**
        * List of Sass files we're tracking
        */
        this.sassFiles = [];
        if (!logger) {
            logger = new Logger.FakeLogger();
        }

        _.extend(this, {
            options: options,
            logger: logger
        });
    }
    /**
    * Compile a compass project
    */
    CompassCompiler.prototype.compile = function (overwrites) {
        var _this = this;
        if (typeof overwrites === "undefined") { overwrites = {}; }
        /**
        * Stored options extended with provided overwrites
        */
        var options = this.extendOptions(overwrites);

        /**
        * Should we compile the project?
        */
        var shouldCompile = this.shouldCompile(overwrites);

        return shouldCompile.then(function (shouldCompile) {
            // If we should compile, spawnCompass
            if (shouldCompile) {
                return _this.spawnCompass();
            }

            if (options.logging) {
                _this.logger.info('No changes. Skipping compilation');
            }

            // Return -1 if we didn't compile
            return Q(-1);
        });
    };

    /**
    * Return copy of stored options with provided overwrites
    * @param  {Object}          overwrites The overwrites you wish to apply
    * @return {Options.Options}            Stored options overwritten with
    *                                      provided overwrites
    */
    CompassCompiler.prototype.extendOptions = function (overwrites) {
        if (typeof overwrites === "undefined") { overwrites = {}; }
        return _.extend({}, this.options, overwrites);
    };

    /**
    * Decides if we should compile the project or not based on a few conditions
    */
    CompassCompiler.prototype.shouldCompile = function (overwrites) {
        var _this = this;
        if (typeof overwrites === "undefined") { overwrites = {}; }
        /**
        * Stored options extended with provided overwrites
        */
        var options = this.extendOptions(overwrites);

        // If we don't want to cache the files, we should always compile
        if (!options.cache) {
            return Q(true);
        }

        return this.findSassFiles().then(function (names) {
            // If there is a different number of files then what we know about
            // something has definitely changed, so we can shortcut
            // the cache checking
            if (_this.sassFiles.length !== names.length) {
                return Q(true);
            }

            // Array of promises representing if each file has changed
            var promises = _this.sassFiles.map(_this.hasChanged);

            // Promise representing if anything has changed
            return Q.all(promises).then(function (results) {
                return results.indexOf(true) > -1;
            });
        });
    };

    /**
    * Alias for Files.File#modified
    */
    CompassCompiler.prototype.hasChanged = function (entry) {
        return entry.modified();
    };

    CompassCompiler.prototype.spawnCompass = function (overwrites) {
        var _this = this;
        if (typeof overwrites === "undefined") { overwrites = {}; }
        /**
        * Stored options extended with provided overwrites
        */
        var options = this.extendOptions(overwrites);

        /**
        * Flags for the compass shell
        */
        var flags = this.buildFlags(overwrites);

        if (options.logging) {
            this.logger.info('Running command "' + options.command + ' ' + flags.join(' ') + '"');
        }

        /**
        * Deferred result of this function
        */
        var deferred = Q.defer();

        /**
        * The spawned compass shell
        */
        var compass = child_process.spawn(options.command, flags, { cwd: options.project });

        // If we want to do logging, start logging
        if (options.logging) {
            this.handleLogging(compass, overwrites);
        }

        // When compass exits, resolve the promise
        compass.on('exit', function (code) {
            deferred.resolve(code);
        });

        return deferred.promise.then(function (code) {
            // If we want to cache the files, cache them then return our result code
            if (options.cache) {
                return _this.cacheFiles().then(function () {
                    return code;
                });
            }

            return Q(code);
        });
    };

    CompassCompiler.prototype.cacheFiles = function () {
        var _this = this;
        // First, empty our cache, we only want to store files that exist now
        this.sassFiles = [];

        /**
        * The folder in which sass files are stored
        */
        var parent = this.getSassPath();

        return this.findSassFiles().then(function (names) {
            /**
            * Array of absolute paths to our css files
            */
            var files = names.map(function (name) {
                return path.join(parent, name);
            });

            /**
            * An array of promises containing a file object for each file
            */
            var promises = files.map(_this.makeFile);

            /**
            * When we have the file objects, store them on the compiler
            */
            Q.all(promises).then(function (fs) {
                return _this.sassFiles = fs;
            }).done();
        });
    };

    /**
    * Convert an absolute path into an initiated file object
    */
    CompassCompiler.prototype.makeFile = function (file) {
        var entry = new Files.File(file);

        return entry.init().then(function () {
            return entry;
        });
    };

    /**
    * Generate the path to the folder containing sass files
    * @return {string} The path to the folder containing sass files
    */
    CompassCompiler.prototype.getSassPath = function (overwrites) {
        if (typeof overwrites === "undefined") { overwrites = {}; }
        /**
        * Stored options extended with provided overwrites
        */
        var options = this.extendOptions(overwrites);

        return path.join(options.project, options.sass);
    };

    /**
    * Find the sass files in our project
    */
    CompassCompiler.prototype.findSassFiles = function (overwrites) {
        if (typeof overwrites === "undefined") { overwrites = {}; }
        /**
        * The path for the sass folder
        */
        var parent = this.getSassPath(overwrites);

        return Q(util.findFilesWithExts(parent, ['scss', 'sass']));
    };

    /**
    * Builds flags for the compass shell
    * @param  {Object}   overwrites Any overwrites to the options
    *                               stored on the compiler
    * @return {string[]}            The array of flags
    */
    CompassCompiler.prototype.buildFlags = function (overwrites) {
        if (typeof overwrites === "undefined") { overwrites = {}; }
        /**
        * Stored options extended with provided overwrites
        */
        var options = this.extendOptions(overwrites);

        /**
        * Stores the flags that we're building
        * @type {string[]}
        */
        var flags = ['compile'];

        var flag;

        for (flag in booleanFlags) {
            if (!Object.prototype.hasOwnProperty.call(booleanFlags, flag)) {
                return;
            }

            if (options[booleanFlags[flag]]) {
                flags.push(flag);
            }
        }

        for (flag in stringFlags) {
            if (!Object.prototype.hasOwnProperty.call(stringFlags, flag)) {
                return;
            }

            if (options[stringFlags[flag]]) {
                flags.push(flag, options[stringFlags[flag]]);
            }
        }

        return flags;
    };

    CompassCompiler.prototype.handleLogging = function (compass, overwrites) {
        if (typeof overwrites === "undefined") { overwrites = {}; }
        // Set encodings so we know what we're dealing with
        compass.stdout.setEncoding('utf8');
        compass.stderr.setEncoding('utf8');

        // Redirect compass.stdout to the logger
        compass.stdout.on('data', this.logger.info.bind(this));

        // Redirect compass errors to the logger
        compass.stderr.on('data', function (data) {
            if (!data.match(/^\u001b\[\d+m$/)) {
                this.logger.error('\u001b[31mstderr:\u001b[0m ' + data);
            }
        });
    };
    return CompassCompiler;
})();
exports.CompassCompiler = CompassCompiler;
