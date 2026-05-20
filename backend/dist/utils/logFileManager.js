"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFileManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("./logger");
/**
 * Log File Manager
 * Handles writing logs to files with daily rotation and archiving
 */
class LogFileManager {
    constructor() {
        this.stream = null;
        this.logDir = path.join(process.cwd(), 'logs');
        this.archiveDir = path.join(this.logDir, 'archive');
        this.retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '30', 10);
        this.currentDate = this.getDateString();
        this.currentLogFile = this.getLogFilePath(this.currentDate);
        this.ensureDirectories();
        this.openLogStream();
        this.scheduleArchiving();
    }
    /**
     * Ensure log directories exist
     */
    ensureDirectories() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        if (!fs.existsSync(this.archiveDir)) {
            fs.mkdirSync(this.archiveDir, { recursive: true });
        }
    }
    /**
     * Get date string in YYYY-MM-DD format
     */
    getDateString(date = new Date()) {
        return date.toISOString().split('T')[0];
    }
    /**
     * Get log file path for a specific date
     */
    getLogFilePath(dateString) {
        return path.join(this.logDir, `app-${dateString}.log`);
    }
    /**
     * Open log file stream
     */
    openLogStream() {
        this.stream = fs.createWriteStream(this.currentLogFile, { flags: 'a' });
    }
    /**
     * Close current log stream
     */
    closeLogStream() {
        if (this.stream) {
            this.stream.end();
            this.stream = null;
        }
    }
    /**
     * Rotate log file if date has changed
     */
    rotateIfNeeded() {
        const today = this.getDateString();
        if (today !== this.currentDate) {
            logger_1.logger.info('Rotating log file', { oldDate: this.currentDate, newDate: today });
            // Close current stream
            this.closeLogStream();
            // Archive yesterday's log
            this.archiveLog(this.currentDate);
            // Update to today
            this.currentDate = today;
            this.currentLogFile = this.getLogFilePath(today);
            // Open new stream
            this.openLogStream();
            // Clean old archives
            this.cleanOldArchives();
        }
    }
    /**
     * Write log entry to file
     */
    writeLog(level, message, context) {
        this.rotateIfNeeded();
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
        const logEntry = `[${timestamp}] [${level}] ${message}${contextStr}\n`;
        if (this.stream) {
            this.stream.write(logEntry);
        }
    }
    /**
     * Archive log file by compressing it
     */
    archiveLog(dateString) {
        const logFile = this.getLogFilePath(dateString);
        if (!fs.existsSync(logFile)) {
            return;
        }
        try {
            const archiveFile = path.join(this.archiveDir, `app-${dateString}.log`);
            // Move file to archive directory
            fs.renameSync(logFile, archiveFile);
            logger_1.logger.info('Log file archived', { date: dateString, archive: archiveFile });
        }
        catch (error) {
            logger_1.logger.error('Failed to archive log file', error, { date: dateString });
        }
    }
    /**
     * Clean old archived logs based on retention policy
     */
    cleanOldArchives() {
        try {
            const files = fs.readdirSync(this.archiveDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
            files.forEach(file => {
                const match = file.match(/app-(\d{4}-\d{2}-\d{2})\.log/);
                if (match) {
                    const fileDate = new Date(match[1]);
                    if (fileDate < cutoffDate) {
                        const filePath = path.join(this.archiveDir, file);
                        fs.unlinkSync(filePath);
                        logger_1.logger.info('Old log file deleted', { file, age: this.retentionDays });
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to clean old archives', error);
        }
    }
    /**
     * Schedule daily archiving check (runs every hour)
     */
    scheduleArchiving() {
        setInterval(() => {
            this.rotateIfNeeded();
        }, 60 * 60 * 1000); // Check every hour
    }
    /**
     * Get log statistics
     */
    getStats() {
        let todaySize = 0;
        let archiveSize = 0;
        let totalLogs = 0;
        try {
            if (fs.existsSync(this.currentLogFile)) {
                todaySize = fs.statSync(this.currentLogFile).size;
                totalLogs++;
            }
            if (fs.existsSync(this.archiveDir)) {
                const files = fs.readdirSync(this.archiveDir);
                totalLogs += files.length;
                files.forEach(file => {
                    const filePath = path.join(this.archiveDir, file);
                    archiveSize += fs.statSync(filePath).size;
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to get log stats', error);
        }
        return {
            totalLogs,
            todaySize,
            archiveSize,
            retentionDays: this.retentionDays,
        };
    }
    /**
     * Close all streams (for graceful shutdown)
     */
    close() {
        this.closeLogStream();
    }
}
// Export singleton instance
exports.logFileManager = new LogFileManager();
//# sourceMappingURL=logFileManager.js.map