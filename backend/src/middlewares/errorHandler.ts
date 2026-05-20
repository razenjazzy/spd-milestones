import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export default function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  
  // Log error with context
  logger.error('Error handler caught exception', err, {
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
