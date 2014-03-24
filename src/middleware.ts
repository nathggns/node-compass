import path     = require('path');
import express  = require('express');

import Options  = require('./options');
import Compiler = require('./compiler');
import Logger = require('./logger');

/**
 * Should we handle a specific request
 *
 * Uses the file extension to decide if we should handle a specific request
 * 
 * @param  {express.Request} req The express request
 * @return {boolean}             If we should handle the request
 */
export function shouldHandleRequest(req : express.Request) : boolean {
    return path.extname(req.path) === '.css';
}

/**
 * Generate a middleware for serviving compiled files
 * @param  {Options.Options}   options  The options for the project
 * @param  {Compiler.Compiler} compiler The compiler to use for the project
 * @return {express.Handler}            The express handler for the project
 */
export function MiddlewareFactory(options : Options.Options, compiler : Compiler.Compiler) : express.Handler {

    /**
     * Takes a express request and compiles the compass project if we need to
     * @param {express.Request}  req  The express request
     * @param {express.Response} res  The express response
     * @param {Function}         next Function to call when we're done
     */
    function Middleware(req : express.Request, res : express.Response, next ?: Function) : void {
        if (!shouldHandleRequest(req)) {
            return next();
        }

        compiler.compile().then(function(code : number) {
            next();
        }).done();
    }

    return Middleware;
}