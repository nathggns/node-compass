/// <reference path="references/tsd.d.ts" />

import path     = require('path');
import express  = require('express');

import Options  = require('./options');
import Compiler = require('./compiler');
import Logger   = require('./logger');

/**
 * Should we handle a specific request
 *
 * Uses the file extension to decide if we should handle a specific request
 */
export function shouldHandleRequest(req : express.Request) : boolean {
    return path.extname(req.path) === '.css';
}

/**
 * Generate a middleware for serving compiled files
 */
export function MiddlewareFactory(options : Options.Options, compiler : Compiler.Compiler) : express.Handler {

    /**
     * Takes a express request and compiles the compass project if we need to
     */
    function Middleware(req : express.Request, res : express.Response, next ?: Function) : void {
        if (!shouldHandleRequest(req)) {
            next();

            return;
        }

        compiler.compile().then(() => next()).done();
    }

    return Middleware;
}