import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

/**
 * Log File Manager
 * Handles writing logs to files with daily rotation and archiving
 */
class LogFileManager {
  private logDir: string;
  private archiveDir: string;
  private currentLogFile: string;
  private currentDate: string;
  private retentionDays: number;
  private stream: fs.WriteStream | null = null;

  constructor() {
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
  private ensureDirectories(): void {
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
  private getDateString(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get log file path for a specific date
   */
  private getLogFilePath(dateString: string): string {
    return path.join(this.logDir, `app-${dateString}.log`);
  }

  /**
   * Open log file stream
   */
  private openLogStream(): void {
    this.stream = fs.createWriteStream(this.currentLogFile, { flags: 'a' });
  }

  /**
   * Close current log stream
   */
  private closeLogStream(): void {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
  }

  /**
   * Rotate log file if date has changed
   */
  private rotateIfNeeded(): void {
    const today = this.getDateString();
    if (today !== this.currentDate) {
      logger.info('Rotating log file', { oldDate: this.currentDate, newDate: today });
      
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
  writeLog(level: string, message: string, context?: any): void {
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
  private archiveLog(dateString: string): void {
    const logFile = this.getLogFilePath(dateString);
    
    if (!fs.existsSync(logFile)) {
      return;
    }

    try {
      const archiveFile = path.join(this.archiveDir, `app-${dateString}.log`);
      
      // Move file to archive directory
      fs.renameSync(logFile, archiveFile);
      
      logger.info('Log file archived', { date: dateString, archive: archiveFile });
    } catch (error) {
      logger.error('Failed to archive log file', error as Error, { date: dateString });
    }
  }

  /**
   * Clean old archived logs based on retention policy
   */
  private cleanOldArchives(): void {
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
            logger.info('Old log file deleted', { file, age: this.retentionDays });
          }
        }
      });
    } catch (error) {
      logger.error('Failed to clean old archives', error as Error);
    }
  }

  /**
   * Schedule daily archiving check (runs every hour)
   */
  private scheduleArchiving(): void {
    setInterval(() => {
      this.rotateIfNeeded();
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Get log statistics
   */
  getStats(): { totalLogs: number; todaySize: number; archiveSize: number; retentionDays: number } {
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
    } catch (error) {
      logger.error('Failed to get log stats', error as Error);
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
  close(): void {
    this.closeLogStream();
  }
}

// Export singleton instance
export const logFileManager = new LogFileManager();
