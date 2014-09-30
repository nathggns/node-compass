/// <reference path="references/tsd.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Q = require('q');
var fs = require('q-io/fs');
var path = require('path');
var _ = require('lodash');

var util = require('./util');

var DoesNotExistError = (function (_super) {
    __extends(DoesNotExistError, _super);
    function DoesNotExistError() {
        _super.apply(this, arguments);
        this.name = 'DoesNotExistError';
        this.message = 'file or folder does not exist';
    }
    return DoesNotExistError;
})(util.ErrorClass);
exports.DoesNotExistError = DoesNotExistError;

/**
* A wrapper for a file, with a bunch of extra helpful utilities
*/
var File = (function () {
    function File(file) {
        this._path = file;
    }
    Object.defineProperty(File.prototype, "path", {
        /**
        * Public accessor for File#_path
        */
        get: function () {
            return this._path;
        },
        enumerable: true,
        configurable: true
    });

    File.prototype.init = function () {
        var _this = this;
        return this.stat().then(function (stats) {
            _this.stats = stats;

            return stats;
        });
    };

    File.prototype.stat = function () {
        return fs.stat(this._path);
    };

    /**
    * Has an entry has changed at all (contents, or if has been removed)
    * since this function (or File#init) was last called
    *
    * @todo Will always say the file has changed if it doesn't exist, even if
    *       it didn't exist when the object was created
    */
    File.prototype.modified = function () {
        var _this = this;
        // Start by checking if the file exists
        return this.exists().then(function (exists) {
            // If the file doesn't exist, we'll say it's been changed
            if (!exists) {
                return Q(true);
            }

            // If the file exists, check if it has been changed
            return _this.changed();
        });
    };

    /**
    * Has the content of a file has been changed
    */
    File.prototype.changed = function () {
        var _this = this;
        return this.stat().then(function (stats) {
            /**
            * Has the file changed at all?
            */
            var changed;

            // If this function has never been called before, we'll say that
            // the file has changed
            changed = !_this.stats;

            // If this function has been called before, check if the file
            // has been modified (by checking it's mtime)
            if (!changed) {
                changed = _this.stats.node.mtime.getTime() !== stats.node.mtime.getTime();
            }

            // If the file has changed, set the new stats and return true
            if (changed) {
                _this.stats = stats;

                return true;
            }

            // The file hasn't changed
            return false;
        });
    };

    /**
    * Check if the file exists or not
    */
    File.prototype.exists = function () {
        // We'll use that stat function as that throws a certain exception
        // if the file doesn't exist
        return this.stat().then(function () {
            return true;
        }, function (err) {
            // If it's the exception for the file not existing, return false
            if (err.errno === 34) {
                return false;
            }

            throw err;
        });
    };
    return File;
})();
exports.File = File;

/**
* A class that handles watching for changes in a
* folder
*/
var WatchFolderForChanges = (function () {
    /**
    * Create a watcher for changes in a directory
    */
    function WatchFolderForChanges(folder, exts) {
        this.folder = folder;
        this.exts = exts.map(function (ext) {
            return ext.toLowerCase();
        });
    }
    /**
    * Detect if there has been any changes since this method was last called
    * Will always return true the first time this method is called
    */
    WatchFolderForChanges.prototype.hasChanged = function () {
        var _this = this;
        return this.errorIfNotExists().then(function () {
            return _this.list();
        }).then(function (files) {
            // If the files arrays are not exactly the same, update
            // our internal files array and return true
            if (!_this.files || files.length !== _this.files.length) {
                return _this.update(files);
            }

            /**
            * The paths to each file
            */
            var paths = _.pluck(_this.files, 'path');

            // If the we don't have the same files, we've detected a change
            if (!_.isEqual(files, paths)) {
                return _this.update(files);
            }

            return Q.all(_this.files.map(function (file) {
                return file.changed();
            })).then(function (hasChanged) {
                return hasChanged.indexOf(true) > -1;
            });
        });
    };

    /**
    * Update the internal store of files
    */
    WatchFolderForChanges.prototype.update = function (files) {
        var _this = this;
        var instances = files.map(function (file) {
            return new File(file);
        });
        var promises = instances.map(function (file) {
            return file.init().then(function () {
                return file;
            });
        });

        var promise = Q.all(promises);

        return promise.then(function (files) {
            _this.files = files;

            return true;
        });
    };

    /**
    * Throw a DoesNotExistsError if the folder does not exist
    */
    WatchFolderForChanges.prototype.errorIfNotExists = function () {
        return this.folder.exists().then(function (exists) {
            if (!exists) {
                throw new DoesNotExistError();
            }
        });
    };

    /**
    * List files that match the extension we're working on
    */
    WatchFolderForChanges.prototype.list = function () {
        var _this = this;
        return this.folder.list().then(function (files) {
            return files.filter(function (file) {
                return _this.exts.indexOf(path.extname(file).substr(1).toLowerCase()) > -1;
            });
        });
    };
    return WatchFolderForChanges;
})();
exports.WatchFolderForChanges = WatchFolderForChanges;

var Folder = (function () {
    function Folder(path) {
        this.file = new File(path);
    }
    Object.defineProperty(Folder.prototype, "path", {
        /**
        * The path to the folder we're working on
        */
        get: function () {
            return this.file.path;
        },
        enumerable: true,
        configurable: true
    });

    /**
    * List files in the folder
    */
    Folder.prototype.list = function () {
        var _this = this;
        return fs.list(this.path).then(function (names) {
            return names.map(function (name) {
                return path.join(_this.path, name);
            });
        }).then(function (files) {
            return files.sort();
        });
    };

    /**
    * Check to see if the folder exists
    */
    Folder.prototype.exists = function () {
        return this.file.exists();
    };

    /**
    * Return an instance of WatchFolderForChanges for this folder
    */
    Folder.prototype.watchForChanges = function (exts) {
        return new WatchFolderForChanges(this, exts);
    };
    return Folder;
})();
exports.Folder = Folder;
