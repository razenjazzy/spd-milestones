"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandler;
const logger_1 = require("../utils/logger");
function errorHandler(err, req, res, _next) {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    // Log error with context
    logger_1.logger.error('Error handler caught exception', err, {
        method: req.method,
        path: req.path,
        status,
        message,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    // Send error response
    res.status(status).json({
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}
//# sourceMappingURL=errorHandler.js.map