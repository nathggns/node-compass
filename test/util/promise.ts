/// <reference path="../boot.ts" />

import Q    = require('q');
import util = require('../../src/util');

export class PromiseResolvedError extends util.ErrorClass {
    name = 'PromiseResolvedError';
    message = 'Promise resolved when it should not have done';
}

export class TestPromise<T> {

    promise : Q.Promise<T>;

    test (promise : Q.Promise<T>) {
        this.promise = promise;

        return this;
    }

    shouldNotResolve() : Q.Promise<T> {
        var deferred = Q.defer<T>();

        this.promise.then(function() {
            throw new PromiseResolvedError();
        }, () => deferred.resolve(this.promise)).done();

        return deferred.promise;
    }

    static make<U> (promise : Q.Promise<U> = null) : TestPromise<U> {
        var instance = new TestPromise<U>();

        if (promise) {
            instance.test(promise)
        }

        return instance;
    }
}