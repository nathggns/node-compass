
var FakeLogger = (function () {
    function FakeLogger() {
    }
    FakeLogger.prototype.log = function (type, message) {
    };

    FakeLogger.prototype.info = function (message) {
    };
    FakeLogger.prototype.warn = function (message) {
    };
    FakeLogger.prototype.error = function (message) {
    };
    return FakeLogger;
})();
exports.FakeLogger = FakeLogger;
