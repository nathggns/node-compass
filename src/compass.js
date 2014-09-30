/// <reference path="references/tsd.d.ts" />
var Middleware = require('./middleware');
var Options = require('./options');

var Compiler = require('./compiler');

/**
* Factory for a Middleware that will compiling compass projects
*/
function HandlerFactory(overrides, logger) {
    if (typeof overrides === "undefined") { overrides = {}; }
    /**
    * Extended options with our overrides
    */
    var options = Options.ExtendOptions(overrides);

    if (!logger) {
        var winston = require('winston');

        /**
        * Create an instance of winston that uses the Console transport
        */
        logger = new (winston.Logger)({
            transports: [
                new winston.transports.Console()
            ]
        });
    }

    var compiler = new Compiler.CompassCompiler(options, logger);

    return Middleware.MiddlewareFactory(options, compiler);
}
exports.HandlerFactory = HandlerFactory;
