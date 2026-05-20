"use strict";
/**
 * Backend Logger Utility
 * Provides structured logging with different levels: debug, info, warn, error
 * Writes logs to console and daily log files with archiving
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.Logger = exports.logger = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.fileManager = null;
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
        this.writeToFile = process.env.LOG_TO_FILE !== 'false';
        // Initialize file manager only if writing to file
        if (this.writeToFile) {
            this.initFileManager();
        }
    }
    /**
     * Initialize file manager (lazy loading to avoid circular dependencies)
     */
    initFileManager() {
        try {
            const { logFileManager } = require('./logFileManager');
            this.fileManager = logFileManager;
        }
        catch (error) {
            console.error('Failed to initialize log file manager:', error);
            this.writeToFile = false;
        }
    }
    /**
     * Format log message with timestamp and context
     */
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level}] ${message}${contextStr}`;
    }
    /**
     * Write to log file
     */
    writeToLogFile(level, message, context) {
        if (this.writeToFile && this.fileManager) {
            try {
                this.fileManager.writeLog(level, message, context);
            }
            catch (error) {
                console.error('Failed to write to log file:', error);
            }
        }
    }
    /**
     * Get colored output for console (development only)
     */
    getColorCode(level) {
        const colors = {
            DEBUG: '\x1b[36m', // Cyan
            INFO: '\x1b[32m', // Green
            WARN: '\x1b[33m', // Yellow
            ERROR: '\x1b[31m', // Red
        };
        return this.isDevelopment ? (colors[level] || '') : '';
    }
    resetColor() {
        return this.isDevelopment ? '\x1b[0m' : '';
    }
    /**
     * Log debug messages (only in development)
     */
    debug(message, context) {
        if (this.level <= LogLevel.DEBUG) {
            const color = this.getColorCode('DEBUG');
            console.debug(`${color}${this.formatMessage('DEBUG', message, context)}${this.resetColor()}`);
            this.writeToLogFile('DEBUG', message, context);
        }
    }
    /**
     * Log info messages
     */
    info(message, context) {
        if (this.level <= LogLevel.INFO) {
            const color = this.getColorCode('INFO');
            console.info(`${color}${this.formatMessage('INFO', message, context)}${this.resetColor()}`);
            this.writeToLogFile('INFO', message, context);
        }
    }
    /**
     * Log warning messages
     */
    warn(message, context) {
        if (this.level <= LogLevel.WARN) {
            const color = this.getColorCode('WARN');
            console.warn(`${color}${this.formatMessage('WARN', message, context)}${this.resetColor()}`);
            this.writeToLogFile('WARN', message, context);
        }
    }
    /**
     * Log error messages
     */
    error(message, error, context) {
        if (this.level <= LogLevel.ERROR) {
            const errorDetails = error instanceof Error
                ? { message: error.message, stack: error.stack }
                : error;
            const color = this.getColorCode('ERROR');
            console.error(`${color}${this.formatMessage('ERROR', message, { ...context, error: errorDetails })}${this.resetColor()}`);
            this.writeToLogFile('ERROR', message, { ...context, error: errorDetails });
        }
    }
    /**
     * Log HTTP requests
     */
    http(method, url, statusCode, duration) {
        const context = { method, url };
        if (statusCode)
            context.statusCode = statusCode;
        if (duration)
            context.duration = `${duration}ms`;
        const level = statusCode && statusCode >= 400 ? 'error' : 'info';
        this[level](`HTTP ${method} ${url}`, context);
    }
    /**
     * Log database operations
     */
    db(operation, collection, data) {
        this.debug(`DB ${operation}: ${collection}`, data);
    }
    /**
     * Log service operations
     */
    service(serviceName, operation, data) {
        this.debug(`Service [${serviceName}]: ${operation}`, data);
    }
    /**
     * Set log level dynamically
     */
    setLevel(level) {
        const levelMap = {
            debug: LogLevel.DEBUG,
            info: LogLevel.INFO,
            warn: LogLevel.WARN,
            error: LogLevel.ERROR,
        };
        this.level = levelMap[level];
    }
    /**
     * Log startup information
     */
    startup(service, port, config) {
        this.info(`🚀 ${service} started`, { port, ...config });
    }
    /**
     * Log shutdown information
     */
    shutdown(service, reason) {
        this.info(`🛑 ${service} shutting down`, { reason });
    }
    /**
     * Get log statistics
     */
    getStats() {
        if (this.fileManager) {
            return this.fileManager.getStats();
        }
        return null;
    }
}
exports.Logger = Logger;
// Export singleton instance
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map