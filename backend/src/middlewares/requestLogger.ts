import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * HTTP Request Logger Middleware
 * Logs all incoming requests and their responses
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log incoming request
  logger.http(req.method, req.path, undefined, undefined);
  logger.debug('Request details', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.http(req.method, req.path, res.statusCode, duration);
    
    if (res.statusCode >= 400) {
      logger.warn('Request failed', {
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
