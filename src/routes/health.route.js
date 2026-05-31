import express from 'express';
import { checkServerHealth, checkDatabaseHealth } from '../controllers/health.controller.js';

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Kiểm tra tình trạng hoạt động của Server
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Server hoạt động bình thường
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Server is running healthy"
 *                 data:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                       example: 12.34
 *                     timestamp:
 *                       type: string
 *                       example: "2026-05-31T08:00:00.000Z"
 */
router.get('/health', checkServerHealth);

/**
 * @swagger
 * /db-health:
 *   get:
 *     summary: Kiểm tra kết nối tới cơ sở dữ liệu PostgreSQL
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Kết nối tới DB thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Database connection is successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     dbTime:
 *                       type: string
 *                       example: "2026-05-31T08:00:00.000Z"
 *                     timestamp:
 *                       type: string
 *                       example: "2026-05-31T08:00:00.000Z"
 *       500:
 *         description: Lỗi kết nối tới cơ sở dữ liệu
 */
router.get('/db-health', checkDatabaseHealth);

export default router;
