///<reference path='./references/tsd.d.ts'/>
///<reference path='./custom-q.d.ts'/>

import Middleware = require('./middleware');
import Options    = require('./options');
import express    = require('express');
import Compiler   = require('./compiler');
import Logger     = require('./logger');

var winston = require('winston');

/**
 * Factory for a Middleware that will compiling compass projects
 */
export function HandlerFactory(overrides : Object = {}) : express.Handler {

    /**
     * Extended options with our overrides
     */
    var options = Options.ExtendOptions(overrides);

    /**
     * Create an instance of winston that uses the Console transport
     * @todo Make this extendable
     */
    var logger = new (winston.Logger)({
        transports : [
            new winston.transports.Console()
        ]
    });

    /**
     * The compass compiler
     */
    var compiler = new Compiler.CompassCompiler(options, logger);

    return Middleware.MiddlewareFactory(options, compiler);
}