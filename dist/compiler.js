var Q = require('q');
var child_process = require('child_process');
var _ = require('lodash');

var path = require('path');

var Logger = require('./logger');
var util = require('./util');
var Files = require('./files');

var booleanFlags = util.addIndexer({
    '--no-line-comments': 'comments',
    '--relative-assets': 'relative'
});

var stringFlags = util.addIndexer({
    '-c': 'config_file',
    '-I': 'import_path',
    '--output-style': 'mode',
    '--css-dir': 'css',
    '--sass-dir': 'sass',
    '--images-dir': 'img'
});

var CompassCompiler = (function () {
    function CompassCompiler(options, logger) {
        if (typeof logger === "undefined") { logger = null; }
        this.sassFiles = [];
        if (!logger) {
            logger = new Logger.FakeLogger();
        }

        _.extend(this, {
            options: options,
            logger: logger
        });
    }
    CompassCompiler.prototype.compile = function (overwrites) {
        var _this = this;
        if (typeof overwrites === "undefined") { overwrites = {}; }
        var options = this.extendOptions(overwrites);

        var shouldCompile = this.shouldCompile(overwrites);

        return shouldCompile.then(function (shouldCompile) {
            if (shouldCompile) {
                return _this.spawnCompass();
            }

            if (options.logging) {
                _this.logger.info('No changes. Skipping compilation');
            }

            return Q(-1);
        });
    };

    CompassCompiler.prototype.extendOptions = function (overwrites) {
        if (typeof overwrites === "undefined") { overwrites = {}; }
        return _.extend({}, this.options, overwrites);
    };

    CompassCompiler.prototype.shouldCompile = function (overwrites) {
        var _this = this;
        if (typeof overwrites === "undefined") { overwrites = {}; }
        var options = this.extendOptions(overwrites);

        if (!options.cache) {
            return Q(true);
        }

        var parent = this.getSassPath();

        return this.findSassFiles().then(function (names) {
            if (_this.sassFiles.length !== names.length) {
                return Q(true);
            }

            var files = names.map(function (name) {
                return path.join(parent, name);
            });

            var promises = _this.sassFiles.map(_this.hasChanged);

            var deferredHasChanged = Q.all(promises).then(function (results) {
                return results.indexOf(true) > -1;
            });

            return deferredHasChanged;
        });
    };

    CompassCompiler.prototype.hasChanged = function (entry) {
        return entry.modified();
    };

    CompassCompiler.prototype.spawnCompass = function (overwrites) {
        var _this = this;
        if (typeof overwrites === "undefined") { overwrites = {}; }
        var options = this.extendOptions(overwrites);

        var flags = this.buildFlags(overwrites);

        if (options.logging) {
            this.logger.info('Running command "' + options.command + ' ' + flags.join(' ') + '"');
        }

        var deferred = Q.defer();

        var compass = child_process.spawn(options.command, flags, { cwd: options.project });

        if (options.logging) {
            this.handleLogging(compass, overwrites);
        }

        compass.on('exit', function (code) {
            deferred.resolve(code);
        });

        return deferred.promise.then(function (code) {
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
        this.sassFiles = [];

        var parent = this.getSassPath();

        return this.findSassFiles().then(function (names) {
            var files = names.map(function (name) {
                return path.join(parent, name);
            });

            var promises = files.map(_this.makeFile);

            Q.all(promises).then(function (fs) {
                return _this.sassFiles = fs;
            }).done();
        });
    };

    CompassCompiler.prototype.makeFile = function (file) {
        var entry = new Files.File(file);

        return entry.init().then(function () {
            return entry;
        });
    };

    CompassCompiler.prototype.getSassPath = function (overwrites) {
        if (typeof overwrites === "undefined") { overwrites = {}; }
        var options = this.extendOptions(overwrites);

        return path.join(options.project, options.sass);
    };

    CompassCompiler.prototype.findSassFiles = function (overwrites) {
        if (typeof overwrites === "undefined") { overwrites = {}; }
        var options = this.extendOptions(overwrites);

        var parent = this.getSassPath(overwrites);

        return util.findFilesWithExts(parent, ['scss', 'sass']);
    };

    CompassCompiler.prototype.buildFlags = function (overwrites) {
        if (typeof overwrites === "undefined") { overwrites = {}; }
        var options = this.extendOptions(overwrites);

        var flags = ['compile'];

        var name;
        var flag;

        for (flag in booleanFlags) {
            name = booleanFlags[flag];

            if (options[name]) {
                flags.push(flag);
            }
        }

        for (flag in stringFlags) {
            name = stringFlags[flag];

            if (options[name]) {
                flags.push(flag, options[name]);
            }
        }

        return flags;
    };

    CompassCompiler.prototype.handleLogging = function (compass, overwrites) {
        if (typeof overwrites === "undefined") { overwrites = {}; }
        compass.stdout.setEncoding('utf8');
        compass.stderr.setEncoding('utf8');

        compass.stdout.on('data', this.logger.info.bind(this));

        compass.stderr.on('data', function (data) {
            if (!data.match(/^\u001b\[\d+m$/)) {
                this.logger.error('\u001b[31mstderr:\u001b[0m ' + data);
            }
        });
    };
    return CompassCompiler;
})();
exports.CompassCompiler = CompassCompiler;
