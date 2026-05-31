import express from 'express';
import { getTags } from '../controllers/tag.controller.js';

const router = express.Router();

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Lấy danh sách tag nhạc (public)
 *     tags:
 *       - Catalog
 *     responses:
 *       200:
 *         description: Lấy danh sách tag thành công
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
 *                   example: "Lấy danh sách tag thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tag_id:
 *                             type: string
 *                             example: "1"
 *                           tag_name:
 *                             type: string
 *                             example: "synth"
 *                           slug:
 *                             type: string
 *                             example: "synth"
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get('/', getTags);

export default router;
