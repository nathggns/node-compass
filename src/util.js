/// <reference path="references/tsd.d.ts" />
var Q = require('q');
var fs = require('fs');
var path = require('path');

/**
* A class for easily extending exceptions
*/
var ErrorClass = (function () {
    function ErrorClass(message) {
        if (typeof message === "undefined") { message = null; }
        this.message = message || this.message;
    }
    return ErrorClass;
})();
exports.ErrorClass = ErrorClass;

/**
* Find files in a directory that match a set of extensions
*/
function findFilesWithExts(dir, exts) {
    /**
    * Deferred list of files that match the passed extensions
    */
    var deferredFiles = Q.defer();

    // Format the exts properly due to how path.extname works
    exts = exts.map(function (ext) {
        return ext.substr(0, 1) === '.' ? ext.toLowerCase() : '.' + ext.toLowerCase();
    });

    fs.readdir(dir, function (err, files) {
        if (err) {
            return deferredFiles.reject(err);
        }

        // Filter files to only include the files with the correct extensions
        files = files.filter(function (file) {
            return exts.indexOf(path.extname(file)) !== -1;
        });

        // Resolve the promise
        deferredFiles.resolve(files);
    });

    return deferredFiles.promise;
}
exports.findFilesWithExts = findFilesWithExts;
