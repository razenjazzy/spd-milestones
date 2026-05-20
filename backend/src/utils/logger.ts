/**
 * Backend Logger Utility
 * Provides structured logging with different levels: debug, info, warn, error
 * Writes logs to console and daily log files with archiving
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;
  private fileManager: any = null;
  private writeToFile: boolean;

  constructor() {
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
  private initFileManager(): void {
    try {
      const { logFileManager } = require('./logFileManager');
      this.fileManager = logFileManager;
    } catch (error) {
      console.error('Failed to initialize log file manager:', error);
      this.writeToFile = false;
    }
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * Write to log file
   */
  private writeToLogFile(level: string, message: string, context?: LogContext): void {
    if (this.writeToFile && this.fileManager) {
      try {
        this.fileManager.writeLog(level, message, context);
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  /**
   * Get colored output for console (development only)
   */
  private getColorCode(level: string): string {
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
    };
    return this.isDevelopment ? (colors[level as keyof typeof colors] || '') : '';
  }

  private resetColor(): string {
    return this.isDevelopment ? '\x1b[0m' : '';
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.DEBUG) {
      const color = this.getColorCode('DEBUG');
      console.debug(`${color}${this.formatMessage('DEBUG', message, context)}${this.resetColor()}`);
      this.writeToLogFile('DEBUG', message, context);
    }
  }

  /**
   * Log info messages
   */
  info(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.INFO) {
      const color = this.getColorCode('INFO');
      console.info(`${color}${this.formatMessage('INFO', message, context)}${this.resetColor()}`);
      this.writeToLogFile('INFO', message, context);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.WARN) {
      const color = this.getColorCode('WARN');
      console.warn(`${color}${this.formatMessage('WARN', message, context)}${this.resetColor()}`);
      this.writeToLogFile('WARN', message, context);
    }
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.level <= LogLevel.ERROR) {
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
      
      const color = this.getColorCode('ERROR');
      console.error(
        `${color}${this.formatMessage('ERROR', message, { ...context, error: errorDetails })}${this.resetColor()}`
      );
      this.writeToLogFile('ERROR', message, { ...context, error: errorDetails });
    }
  }

  /**
   * Log HTTP requests
   */
  http(method: string, url: string, statusCode?: number, duration?: number): void {
    const context: LogContext = { method, url };
    if (statusCode) context.statusCode = statusCode;
    if (duration) context.duration = `${duration}ms`;
    
    const level = statusCode && statusCode >= 400 ? 'error' : 'info';
    this[level](`HTTP ${method} ${url}`, context);
  }

  /**
   * Log database operations
   */
  db(operation: string, collection: string, data?: any): void {
    this.debug(`DB ${operation}: ${collection}`, data);
  }

  /**
   * Log service operations
   */
  service(serviceName: string, operation: string, data?: any): void {
    this.debug(`Service [${serviceName}]: ${operation}`, data);
  }

  /**
   * Set log level dynamically
   */
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
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
  startup(service: string, port?: number, config?: LogContext): void {
    this.info(`🚀 ${service} started`, { port, ...config });
  }

  /**
   * Log shutdown information
   */
  shutdown(service: string, reason?: string): void {
    this.info(`🛑 ${service} shutting down`, { reason });
  }

  /**
   * Get log statistics
   */
  getStats(): any {
    if (this.fileManager) {
      return this.fileManager.getStats();
    }
    return null;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing or advanced usage
export { Logger, LogLevel };
