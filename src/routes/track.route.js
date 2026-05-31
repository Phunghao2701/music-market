import express from 'express';
import { getTracks, getFeatured, getTrackDetails, getRelated } from '../controllers/track.controller.js';
import { postPlayEvent } from '../controllers/play.controller.js';

const router = express.Router();

/**
 * @swagger
 * /tracks:
 *   get:
 *     summary: Duyệt danh sách bài nhạc đang đăng (public)
 *     tags:
 *       - Tracks
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Lọc theo slug/tên/ID thể loại nhạc
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *         description: Lọc theo slug/tên/ID mood nhạc
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Lọc theo slug/tên/ID tag nhạc
 *       - in: query
 *         name: bpm_min
 *         schema:
 *           type: integer
 *         description: Giá trị BPM tối thiểu
 *       - in: query
 *         name: bpm_max
 *         schema:
 *           type: integer
 *         description: Giá trị BPM tối đa
 *       - in: query
 *         name: musical_key
 *         schema:
 *           type: string
 *         description: Tông nhạc (Ví dụ D Minor, C Major)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm bài nhạc theo tiêu đề
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại (phục vụ phân trang)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số phần tử trên mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     tracks:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */
router.get('/', getTracks);

/**
 * @swagger
 * /tracks/featured:
 *   get:
 *     summary: Lấy danh sách bài nhạc nổi bật (public)
 *     tags:
 *       - Tracks
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bài cần lấy
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/featured', getFeatured);

/**
 * @swagger
 * /tracks/{slug}:
 *   get:
 *     summary: Xem chi tiết một bài nhạc bằng slug (tự động tăng view_count) (public)
 *     tags:
 *       - Tracks
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug của bài nhạc (Ví dụ chill-lofi-beats)
 *     responses:
 *       200:
 *         description: Tìm thấy bài nhạc thành công
 *       404:
 *         description: Không tìm thấy bài nhạc hoặc bài nhạc không công khai
 */
router.get('/:slug', getTrackDetails);

/**
 * @swagger
 * /tracks/{trackId}/related:
 *   get:
 *     summary: Lấy danh sách bài nhạc liên quan (public)
 *     tags:
 *       - Tracks
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài nhạc gốc
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Số lượng bài cần lấy
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/:trackId/related', getRelated);

/**
 * @swagger
 * /tracks/{trackId}/play:
 *   post:
 *     summary: Ghi nhận một lượt nghe nhạc demo (public)
 *     tags:
 *       - Tracks
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài nhạc được nghe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - played_seconds
 *             properties:
 *               played_seconds:
 *                 type: integer
 *                 description: Số giây đã nghe (không âm)
 *                 example: 30
 *     responses:
 *       201:
 *         description: Ghi nhận lượt nghe thành công
 *       400:
 *         description: Dữ liệu gửi lên không hợp lệ (ví dụ played_seconds bị âm)
 *       404:
 *         description: Không tìm thấy bài nhạc hoặc bài nhạc không công khai
 */
router.post('/:trackId/play', postPlayEvent);

export default router;

