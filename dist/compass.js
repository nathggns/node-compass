var Middleware = require('./middleware');
var Options = require('./options');

var Compiler = require('./compiler');

var winston = require('winston');

function HandlerFactory(overrides) {
    if (typeof overrides === "undefined") { overrides = {}; }
    var options = Options.ExtendOptions(overrides);

    var logger = new (winston.Logger)({
        transports: [
            new winston.transports.Console()
        ]
    });

    var compiler = new Compiler.CompassCompiler(options, logger);

    return Middleware.MiddlewareFactory(options, compiler);
}
exports.HandlerFactory = HandlerFactory;
