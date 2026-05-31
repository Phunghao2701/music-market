import express from 'express';
import { postInquiry, getInquiryStatus } from '../controllers/inquiry.controller.js';

const router = express.Router();

/**
 * @swagger
 * /inquiries:
 *   post:
 *     summary: Gửi yêu cầu mua nhạc (Public)
 *     tags:
 *       - Inquiries
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_name
 *               - track_id
 *             properties:
 *               customer_name:
 *                 type: string
 *                 example: "Nguyen Van A"
 *               customer_email:
 *                 type: string
 *                 format: email
 *                 example: "nva@example.com"
 *               customer_phone:
 *                 type: string
 *                 example: "0901234567"
 *               company_name:
 *                 type: string
 *                 example: "Cong ty Giai Tri XYZ"
 *               social_link:
 *                 type: string
 *                 example: "https://facebook.com/nva"
 *               note:
 *                 type: string
 *                 example: "Khach hang muon lam viec nhanh"
 *               track_id:
 *                 type: integer
 *                 example: 1
 *               preferred_license_option_id:
 *                 type: integer
 *                 example: 2
 *               usage_purpose:
 *                 type: string
 *                 enum: [personal_demo, commercial_release, youtube_tiktok, advertising, film_game, live_performance, brand_campaign, other]
 *                 example: "commercial_release"
 *               usage_description:
 *                 type: string
 *                 example: "Su dung de phat hanh single album"
 *               budget:
 *                 type: number
 *                 example: 5000000
 *               currency:
 *                 type: string
 *                 example: "VND"
 *               message:
 *                 type: string
 *                 example: "Vui long lien he som"
 *     responses:
 *       201:
 *         description: Gửi yêu cầu mua nhạc thành công
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
 *                   example: "Gửi yêu cầu mua nhạc thành công."
 *                 data:
 *                   type: object
 *                   properties:
 *                     inquiry:
 *                       type: object
 *       400:
 *         description: Thiếu thông tin bắt buộc hoặc định dạng dữ liệu không chính xác
 *       500:
 *         description: Lỗi hệ thống server
 */
router.post('/', postInquiry);

/**
 * @swagger
 * /inquiries/{purchaseInquiryId}/status:
 *   get:
 *     summary: Xem trạng thái của yêu cầu mua nhạc (Public)
 *     tags:
 *       - Inquiries
 *     parameters:
 *       - in: path
 *         name: purchaseInquiryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của yêu cầu mua nhạc
 *     responses:
 *       200:
 *         description: Tìm thấy yêu cầu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     inquiry:
 *                       type: object
 *                       properties:
 *                         purchase_inquiry_id:
 *                           type: integer
 *                           example: 1
 *                         status:
 *                           type: string
 *                           example: "new"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Không tìm thấy thông tin yêu cầu tương ứng
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get('/:purchaseInquiryId/status', getInquiryStatus);

export default router;
