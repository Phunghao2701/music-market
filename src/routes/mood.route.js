import express from 'express';
import { getMoods } from '../controllers/mood.controller.js';

const router = express.Router();

/**
 * @swagger
 * /moods:
 *   get:
 *     summary: Lấy danh sách mood/cảm xúc nhạc (public)
 *     tags:
 *       - Catalog
 *     responses:
 *       200:
 *         description: Lấy danh sách mood thành công
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
 *                   example: "Lấy danh sách mood/cảm xúc thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     moods:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           mood_id:
 *                             type: string
 *                             example: "1"
 *                           mood_name:
 *                             type: string
 *                             example: "Energetic"
 *                           slug:
 *                             type: string
 *                             example: "energetic"
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get('/', getMoods);

export default router;
