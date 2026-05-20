"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
/**
 * HTTP Request Logger Middleware
 * Logs all incoming requests and their responses
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    // Log incoming request
    logger_1.logger.http(req.method, req.path, undefined, undefined);
    logger_1.logger.debug('Request details', {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        // Log response
        logger_1.logger.http(req.method, req.path, res.statusCode, duration);
        if (res.statusCode >= 400) {
            logger_1.logger.warn('Request failed', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
            });
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map