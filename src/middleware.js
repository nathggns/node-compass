/// <reference path="references/tsd.d.ts" />
var path = require('path');

/**
* Should we handle a specific request
*
* Uses the file extension to decide if we should handle a specific request
*/
function shouldHandleRequest(req) {
    return path.extname(req.path) === '.css';
}
exports.shouldHandleRequest = shouldHandleRequest;

/**
* Generate a middleware for serviving compiled files
*/
function MiddlewareFactory(options, compiler) {
    /**
    * Takes a express request and compiles the compass project if we need to
    */
    function Middleware(req, res, next) {
        if (!exports.shouldHandleRequest(req)) {
            next();

            return;
        }

        compiler.compile().then(function () {
            return next();
        }).done();
    }

    return Middleware;
}
exports.MiddlewareFactory = MiddlewareFactory;
