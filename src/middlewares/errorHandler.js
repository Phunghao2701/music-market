import { ApiResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Global Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log error stack for developer visibility using custom logger
  logger.error(err.message || 'Internal Server Error', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // In production, do not leak internal stack traces or database errors directly
  const isDev = process.env.NODE_ENV === 'development';
  const errors = isDev ? { stack: err.stack, detail: err.detail } : null;

  return ApiResponse.error(res, message, statusCode, errors);
};

/**
 * Custom AppError class to throw operational errors
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
