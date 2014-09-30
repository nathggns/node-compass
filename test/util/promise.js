/// <reference path="../boot.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Q = require('q');
var util = require('../../src/util');

var PromiseResolvedError = (function (_super) {
    __extends(PromiseResolvedError, _super);
    function PromiseResolvedError() {
        _super.apply(this, arguments);
        this.name = 'PromiseResolvedError';
        this.message = 'Promise resolved when it should not have done';
    }
    return PromiseResolvedError;
})(util.ErrorClass);
exports.PromiseResolvedError = PromiseResolvedError;

var TestPromise = (function () {
    function TestPromise() {
    }
    TestPromise.prototype.test = function (promise) {
        this.promise = promise;

        return this;
    };

    TestPromise.prototype.shouldNotResolve = function () {
        var _this = this;
        var deferred = Q.defer();

        this.promise.then(function () {
            throw new PromiseResolvedError();
        }, function () {
            return deferred.resolve(_this.promise);
        }).done();

        return deferred.promise;
    };

    TestPromise.make = function (promise) {
        if (typeof promise === "undefined") { promise = null; }
        var instance = new TestPromise();

        if (promise) {
            instance.test(promise);
        }

        return instance;
    };
    return TestPromise;
})();
exports.TestPromise = TestPromise;
