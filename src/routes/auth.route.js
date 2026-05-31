import express from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập người dùng bằng email và mật khẩu
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@musicmarket.com
 *                 description: Email đăng nhập
 *               password:
 *                 type: string
 *                 example: "adminpassword"
 *                 description: Mật khẩu đăng nhập
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về JWT Token và thông tin người dùng
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
 *                   example: "Đăng nhập thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                           example: "a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7"
 *                         username:
 *                           type: string
 *                           example: "Admin User"
 *                         email:
 *                           type: string
 *                           example: "admin@musicmarket.com"
 *                         role:
 *                           type: string
 *                           example: "admin"
 *                         avatar_url:
 *                           type: string
 *                           example: "https://example.com/avatar.jpg"
 *                         is_active:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Lỗi dữ liệu đầu vào không hợp lệ (thiếu email/password, sai định dạng email)
 *       401:
 *         description: Sai thông tin đăng nhập (email không tồn tại hoặc sai mật khẩu)
 *       403:
 *         description: Tài khoản đã bị vô hiệu hóa
 *       500:
 *         description: Lỗi hệ thống server
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin tài khoản người dùng hiện tại từ JWT token
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Lấy thông tin thành công
 *       200:
 *         description: Lấy thông tin thành công
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
 *                   example: "Lấy thông tin người dùng thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                           example: "a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7"
 *                         username:
 *                           type: string
 *                           example: "Admin User"
 *                         email:
 *                           type: string
 *                           example: "admin@musicmarket.com"
 *                         role:
 *                           type: string
 *                           example: "admin"
 *                         avatar_url:
 *                           type: string
 *                           example: "https://example.com/avatar.jpg"
 *                         is_active:
 *                           type: boolean
 *                           example: true
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         updated_at:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Chưa đăng nhập hoặc Token hết hạn/không hợp lệ
 *       404:
 *         description: Tài khoản không tồn tại
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get('/me', verifyToken, getMe);

export default router;
