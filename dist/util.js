var Q = require('q');
var fs = require('fs');
var path = require('path');

var ErrorClass = (function () {
    function ErrorClass() {
    }
    ErrorClass.prototype.construct = function (message) {
        this.message = message;
    };
    return ErrorClass;
})();
exports.ErrorClass = ErrorClass;


function addIndexer(object) {
    return object;
}
exports.addIndexer = addIndexer;

function findFilesWithExts(dir, exts) {
    var deferredFiles = Q.defer();

    exts = exts.map(function (ext) {
        return ext.substr(0, 1) === '.' ? ext.toLowerCase() : '.' + ext.toLowerCase();
    });

    fs.readdir(dir, function (err, files) {
        if (err) {
            return deferredFiles.reject(err);
        }

        files = files.filter(function (file) {
            return exts.indexOf(path.extname(file)) !== -1;
        });

        deferredFiles.resolve(files);
    });

    return deferredFiles.promise;
}
exports.findFilesWithExts = findFilesWithExts;
