import express from 'express';
import { getGenres } from '../controllers/genre.controller.js';

const router = express.Router();

/**
 * @swagger
 * /genres:
 *   get:
 *     summary: Lấy danh sách thể loại nhạc (public)
 *     tags:
 *       - Catalog
 *     responses:
 *       200:
 *         description: Lấy danh sách thể loại thành công
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
 *                   example: "Lấy danh sách thể loại nhạc thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     genres:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           genre_id:
 *                             type: string
 *                             example: "1"
 *                           genre_name:
 *                             type: string
 *                             example: "Lo-Fi"
 *                           slug:
 *                             type: string
 *                             example: "lo-fi"
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get('/', getGenres);

export default router;
