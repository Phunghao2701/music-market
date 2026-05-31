import express from 'express';
import healthRouter from './health.route.js';
import authRouter from './auth.route.js';
import genreRouter from './genre.route.js';
import moodRouter from './mood.route.js';
import tagRouter from './tag.route.js';
import licensePlanRouter from './licensePlan.route.js';
import trackRouter from './track.route.js';
import adminRouter from './admin.route.js';
import { AppError } from '../middlewares/errorHandler.js';

const router = express.Router();

// Mount system health check router on root
router.use('/', healthRouter);

// Mount authentication router
router.use('/auth', authRouter);

// Mount catalog routers
router.use('/genres', genreRouter);
router.use('/moods', moodRouter);
router.use('/tags', tagRouter);
router.use('/license-plans', licensePlanRouter);
router.use('/tracks', trackRouter);

// Mount admin routers
router.use('/admin', adminRouter);

// Fallback for undefined routes
router.use('*', (req, res, next) => {
  next(new AppError(`API endpoint ${req.originalUrl} not found`, 404));
});

export default router;

