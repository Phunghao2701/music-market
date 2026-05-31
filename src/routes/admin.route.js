import express from 'express';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { getPlayEvents } from '../controllers/play.controller.js';
import {
  getTracks,
  createTrack,
  getTrackById,
  updateTrack,
  updateStatus,
  publishTrack,
  deleteTrack
} from '../controllers/adminTrack.controller.js';

const router = express.Router();

// Role config for track managers
const allowedManagers = requireRole('admin', 'producer');

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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/tracks/:trackId/play-events', verifyToken, requireRole('admin'), getPlayEvents);

/**
 * @swagger
 * /admin/tracks:
 *   get:
 *     summary: Danh sách toàn bộ bài nhạc của người dùng/hệ thống (Admin/Producer)
 *     tags:
 *       - Admin Catalog
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
router.get('/tracks', verifyToken, allowedManagers, getTracks);

/**
 * @swagger
 * /admin/tracks:
 *   post:
 *     summary: Tạo bài nhạc mới (Admin/Producer)
 *     tags:
 *       - Admin Catalog
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Study Lofi Beat"
 *               slug:
 *                 type: string
 *                 example: "new-study-lofi-beat"
 *               description:
 *                 type: string
 *               bpm:
 *                 type: integer
 *               musical_key:
 *                 type: string
 *               duration_seconds:
 *                 type: integer
 *               cover_image_url:
 *                 type: string
 *               preview_audio_url:
 *                 type: string
 *               allow_inquiry:
 *                 type: boolean
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["lo-fi", "hip-hop"]
 *               moods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["happy"]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["synth"]
 *     responses:
 *       201:
 *         description: Tạo bài nhạc thành công
 */
router.post('/tracks', verifyToken, allowedManagers, createTrack);

/**
 * @swagger
 * /admin/tracks/{trackId}:
 *   get:
 *     summary: Xem chi tiết bài nhạc trong hệ thống quản trị (Admin/Producer)
 *     tags:
 *       - Admin Catalog
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 */
router.get('/tracks/:trackId', verifyToken, allowedManagers, getTrackById);

/**
 * @swagger
 * /admin/tracks/{trackId}:
 *   put:
 *     summary: Cập nhật thông tin bài nhạc (Admin/Producer)
 *     tags:
 *       - Admin Catalog
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/tracks/:trackId', verifyToken, allowedManagers, updateTrack);

/**
 * @swagger
 * /admin/tracks/{trackId}/status:
 *   patch:
 *     summary: Cập nhật trạng thái bài nhạc (Admin/Producer)
 *     tags:
 *       - Admin Catalog
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: "published"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 */
router.patch('/tracks/:trackId/status', verifyToken, allowedManagers, updateStatus);

/**
 * @swagger
 * /admin/tracks/{trackId}/publish:
 *   patch:
 *     summary: Publish bài nhạc (Admin/Producer)
 *     tags:
 *       - Admin Catalog
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Publish thành công
 */
router.patch('/tracks/:trackId/publish', verifyToken, allowedManagers, publishTrack);

/**
 * @swagger
 * /admin/tracks/{trackId}:
 *   delete:
 *     summary: Xóa mềm bài nhạc (Admin/Producer)
 *     tags:
 *       - Admin Catalog
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa mềm thành công
 */
router.delete('/tracks/:trackId', verifyToken, allowedManagers, deleteTrack);

export default router;
