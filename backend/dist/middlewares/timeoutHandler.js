"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeoutHandler = void 0;
const logger_1 = require("../utils/logger");
/**
 * Timeout middleware to prevent requests from hanging indefinitely
 * @param timeoutMs - Timeout in milliseconds (default: 25000ms)
 */
const timeoutHandler = (timeoutMs = 25000) => {
    return (req, res, next) => {
        // Set a timeout for the request
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                logger_1.logger.error('Request timeout', {
                    method: req.method,
                    url: req.url,
                    timeout: timeoutMs
                });
                res.status(504).json({
                    error: 'Gateway Timeout',
                    message: 'The server took too long to respond'
                });
            }
        }, timeoutMs);
        // Clear timeout when response is sent
        res.on('finish', () => {
            clearTimeout(timeout);
        });
        res.on('close', () => {
            clearTimeout(timeout);
        });
        next();
    };
};
exports.timeoutHandler = timeoutHandler;
//# sourceMappingURL=timeoutHandler.js.map