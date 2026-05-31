import express from 'express';
import { getLicensePlans } from '../controllers/licensePlan.controller.js';

const router = express.Router();

/**
 * @swagger
 * /license-plans:
 *   get:
 *     summary: Lấy danh sách các gói license đang hoạt động (public)
 *     tags:
 *       - Catalog
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
 *                   example: "Lấy danh sách gói license thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     licensePlans:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           license_id:
 *                             type: string
 *                             example: "1"
 *                           license_name:
 *                             type: string
 *                             example: "Standard License"
 *                           slug:
 *                             type: string
 *                             example: "standard-license"
 *                           description:
 *                             type: string
 *                             example: "For personal demo, non-commercial use."
 *                           usage_rights:
 *                             type: string
 *                             example: "Non-exclusive usage rights."
 *                           is_exclusive:
 *                             type: boolean
 *                             example: false
 *                           default_price:
 *                             type: string
 *                             example: "500000.00"
 *                           currency:
 *                             type: string
 *                             example: "VND"
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get('/', getLicensePlans);

export default router;
