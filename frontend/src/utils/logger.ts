/**
 * Frontend Logger Utility
 * Provides structured logging with different levels: info, debug, error, warn
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, context?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }

  /**
   * Log info messages
   */
  info(message: string, context?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | any, context?: any): void {
    if (this.level <= LogLevel.ERROR) {
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
      
      console.error(
        this.formatMessage('ERROR', message, { ...context, error: errorDetails })
      );
    }
  }

  /**
   * Log API requests
   */
  apiRequest(method: string, url: string, data?: any): void {
    this.debug(`API Request: ${method} ${url}`, data);
  }

  /**
   * Log API responses
   */
  apiResponse(method: string, url: string, status: number, data?: any): void {
    const level = status >= 400 ? 'error' : 'debug';
    this[level](`API Response: ${method} ${url} - Status: ${status}`, data);
  }

  /**
   * Log component lifecycle events
   */
  component(name: string, event: string, data?: any): void {
    this.debug(`Component [${name}]: ${event}`, data);
  }

  /**
   * Log user actions
   */
  userAction(action: string, data?: any): void {
    this.info(`User Action: ${action}`, data);
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
}

// Export singleton instance
export const logger = new Logger();

// Export for testing or advanced usage
export { Logger, LogLevel };
