import express from 'express';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { getPlayEvents } from '../controllers/play.controller.js';

const router = express.Router();

/**
 * @swagger
 * /admin/tracks/{trackId}/play-events:
 *   get:
 *     summary: Admin xem lịch sử lượt nghe của một track (yêu cầu quyền Admin)
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài nhạc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Số lượng bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       403:
 *         description: Không có quyền truy cập (chỉ dành cho Admin)
 *       404:
 *         description: Không tìm thấy bài nhạc
 */
router.get('/tracks/:trackId/play-events', verifyToken, requireRole('admin'), getPlayEvents);

export default router;
