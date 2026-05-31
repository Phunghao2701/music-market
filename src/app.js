import express from 'express';
import cors from 'cors';
import rootRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Cấu hình Middleware hệ thống
app.use(cors());
app.use(express.json());

// Định tuyến gốc: Tất cả API sẽ bắt đầu bằng /api/v1
app.use('/api/v1', rootRouter);

// Global Error Handler Middleware (must be registered last)
app.use(errorHandler);

export default app;
