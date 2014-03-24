var Q = require('q');
var fs = require('fs');

var File = (function () {
    function File(file) {
        this.file = file;
    }
    File.prototype.init = function () {
        var _this = this;
        return this.stat().then(function (stats) {
            _this.stats = stats;

            return stats;
        });
    };

    File.prototype.stat = function () {
        var deferredEntry = Q.defer();

        fs.stat(this.file, function (err, stats) {
            if (err) {
                return deferredEntry.reject(err);
            }

            deferredEntry.resolve(stats);
        });

        return deferredEntry.promise;
    };

    File.prototype.modified = function () {
        var _this = this;
        return this.exists().then(function (exists) {
            if (!exists) {
                return Q(true);
            }

            return _this.changed();
        });
    };

    File.prototype.changed = function () {
        var _this = this;
        return this.stat().then(function (stats) {
            var changed;

            changed = !_this.stats;

            if (!changed) {
                changed = _this.stats.mtime.getTime() !== stats.mtime.getTime();
            }

            if (changed) {
                _this.stats = stats;

                return true;
            }

            return false;
        });
    };

    File.prototype.exists = function () {
        return this.stat().then(function () {
            return true;
        }, function (err) {
            if (err.errno === 34) {
                return false;
            }

            throw err;
        });
    };
    return File;
})();
exports.File = File;
