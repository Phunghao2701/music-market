import express from 'express';
import healthRouter from './health.route.js';
import authRouter from './auth.route.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = express.Router();

// Mount system health check router on root
router.use('/', healthRouter);

// Mount authentication router
router.use('/auth', authRouter);

// Fallback for undefined routes
router.use('*', (req, res, next) => {
  next(new AppError(`API endpoint ${req.originalUrl} not found`, 404));
});

export default router;
