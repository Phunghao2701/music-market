import * as healthService from '../services/health.service.js';
import { ApiResponse } from '../utils/response.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Controller to handle simple server health check
 */
export const checkServerHealth = (req, res) => {
  return ApiResponse.success(res, 'Server is running healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Controller to handle database connection check
 */
export const checkDatabaseHealth = async (req, res, next) => {
  try {
    const dbTime = await healthService.getDatabaseTime();
    return ApiResponse.success(res, 'Database connection is successful', {
      dbTime: dbTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(new AppError('Failed to connect to the database: ' + error.message, 500));
  }
};
