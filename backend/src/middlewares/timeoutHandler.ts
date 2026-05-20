import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Timeout middleware to prevent requests from hanging indefinitely
 * @param timeoutMs - Timeout in milliseconds (default: 25000ms)
 */
export const timeoutHandler = (timeoutMs: number = 25000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set a timeout for the request
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('Request timeout', {
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
