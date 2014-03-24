var path = require('path');

function shouldHandleRequest(req) {
    return path.extname(req.path) === '.css';
}
exports.shouldHandleRequest = shouldHandleRequest;

function MiddlewareFactory(options, compiler) {
    function Middleware(req, res, next) {
        if (!exports.shouldHandleRequest(req)) {
            return next();
        }

        compiler.compile().then(function (code) {
            next();
        }).done();
    }

    return Middleware;
}
exports.MiddlewareFactory = MiddlewareFactory;
