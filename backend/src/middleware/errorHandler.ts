import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Temporary: always show error message
  const statusCode = err.statusCode || (err as any).status || (err as any).statusCode || 500;
  const message = err.message || 'Unknown error'; // Always use the message for debugging

  logger.error('Unhandled error', {
    err,
    message: err.message,
    stack: err.stack,
    statusCode,
    type: err.constructor.name,
    properties: Object.keys(err),
  });

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
