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
import {
  postGenre,
  putGenre,
  deleteGenre,
  postMood,
  putMood,
  deleteMood,
  postTag,
  putTag,
  deleteTag,
  putTrackGenres,
  putTrackMoods,
  putTrackTags
} from '../controllers/catalog.controller.js';
import {
  getAudioFiles,
  postAudioFile,
  putAudioFile,
  deleteAudioFile
} from '../controllers/audioFile.controller.js';
import {
  getLicensePlans,
  postLicensePlan,
  putLicensePlan,
  patchLicensePlanStatus,
  deleteLicensePlan
} from '../controllers/licensePlan.controller.js';
import {
  getLicenseOptions,
  postLicenseOption,
  putLicenseOption,
  patchLicenseOptionAvailability,
  deleteLicenseOption
} from '../controllers/trackLicenseOption.controller.js';
import {
  getInquiriesAdmin,
  getInquiryDetailAdmin,
  patchInquiryStatus,
  patchInquiryNote
} from '../controllers/inquiry.controller.js';
import {
  getPurchasesAdmin,
  getPurchaseDetailAdmin,
  postPurchaseAdmin,
  patchPurchaseStatus,
  patchPurchaseDelivery
} from '../controllers/purchase.controller.js';
import {
  getSummary,
  getTopTracks,
  getRevenue
} from '../controllers/dashboard.controller.js';

const router = express.Router();

// Role config helpers
const allowedAdminOnly = requireRole('admin');
const allowedManagers = requireRole('admin', 'producer');

// ==========================================
// PLAY EVENTS HISTORY
// ==========================================
/**
 * @swagger
 * /admin/tracks/{trackId}/play-events:
 *   get:
 *     summary: Xem lịch sử lượt nghe bài nhạc (Admin Only)
 *     tags:
 *       - Admin Tracks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài nhạc
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền admin
 */
router.get('/tracks/:trackId/play-events', verifyToken, requireRole('admin'), getPlayEvents);

// ==========================================
// TRACKS CRUD (Admin/Producer)
// ==========================================
/**
 * @swagger
 * /admin/tracks:
 *   get:
 *     summary: Lấy danh sách tất cả bài nhạc (Admin/Producer)
 *     tags:
 *       - Admin Tracks
 *     security:
 *       - bearerAuth: []
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
 *       - Admin Tracks
 *     security:
 *       - bearerAuth: []
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
 *                 example: "My New Track"
 *               bpm:
 *                 type: integer
 *                 example: 120
 *               musical_key:
 *                 type: string
 *                 example: "C Major"
 *               duration_seconds:
 *                 type: integer
 *                 example: 240
 *               status:
 *                 type: string
 *                 enum: [draft, published, reserved, sold_non_exclusive, sold_exclusive, hidden, archived]
 *                 example: "draft"
 *               allow_inquiry:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo bài nhạc thành công
 */
router.post('/tracks', verifyToken, allowedManagers, createTrack);

/**
 * @swagger
 * /admin/tracks/{trackId}:
 *   get:
 *     summary: Lấy thông tin chi tiết một bài nhạc bằng ID (Admin/Producer)
 *     tags:
 *       - Admin Tracks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài nhạc
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy bài nhạc
 */
router.get('/tracks/:trackId', verifyToken, allowedManagers, getTrackById);

/**
 * @swagger
 * /admin/tracks/{trackId}:
 *   put:
 *     summary: Cập nhật thông tin bài nhạc (Admin/Producer)
 *     tags:
 *       - Admin Tracks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài nhạc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Title"
 *               bpm:
 *                 type: integer
 *                 example: 128
 *               musical_key:
 *                 type: string
 *                 example: "A Minor"
 *               duration_seconds:
 *                 type: integer
 *                 example: 210
 *               status:
 *                 type: string
 *                 enum: [draft, published, reserved, sold_non_exclusive, sold_exclusive, hidden, archived]
 *                 example: "published"
 *               allow_inquiry:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/tracks/:trackId', verifyToken, allowedManagers, updateTrack);
router.patch('/tracks/:trackId/status', verifyToken, allowedManagers, updateStatus);
router.patch('/tracks/:trackId/publish', verifyToken, allowedManagers, publishTrack);

/**
 * @swagger
 * /admin/tracks/{trackId}:
 *   delete:
 *     summary: Xóa bài nhạc (Admin/Producer)
 *     tags:
 *       - Admin Tracks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: trackId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài nhạc
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/tracks/:trackId', verifyToken, allowedManagers, deleteTrack);

// ==========================================
// GLOBAL GENRES CRUD (Admin Only)
// ==========================================
router.post('/genres', verifyToken, allowedAdminOnly, postGenre);
router.put('/genres/:genreId', verifyToken, allowedAdminOnly, putGenre);
router.delete('/genres/:genreId', verifyToken, allowedAdminOnly, deleteGenre);

// ==========================================
// GLOBAL MOODS CRUD (Admin Only)
// ==========================================
router.post('/moods', verifyToken, allowedAdminOnly, postMood);
router.put('/moods/:moodId', verifyToken, allowedAdminOnly, putMood);
router.delete('/moods/:moodId', verifyToken, allowedAdminOnly, deleteMood);

// ==========================================
// GLOBAL TAGS CRUD (Admin Only)
// ==========================================
router.post('/tags', verifyToken, allowedAdminOnly, postTag);
router.put('/tags/:tagId', verifyToken, allowedAdminOnly, putTag);
router.delete('/tags/:tagId', verifyToken, allowedAdminOnly, deleteTag);

// ==========================================
// TRACK CATALOG ASSIGNMENTS (Admin/Producer)
// ==========================================
router.put('/tracks/:trackId/genres', verifyToken, allowedManagers, putTrackGenres);
router.put('/tracks/:trackId/moods', verifyToken, allowedManagers, putTrackMoods);
router.put('/tracks/:trackId/tags', verifyToken, allowedManagers, putTrackTags);

// ==========================================
// TRACK AUDIO FILES CRUD (Admin/Producer)
// ==========================================
router.get('/tracks/:trackId/audio-files', verifyToken, allowedManagers, getAudioFiles);
router.post('/tracks/:trackId/audio-files', verifyToken, allowedManagers, postAudioFile);
router.put('/audio-files/:audioId', verifyToken, allowedManagers, putAudioFile);
router.delete('/audio-files/:audioId', verifyToken, allowedManagers, deleteAudioFile);

// ==========================================
// GLOBAL LICENSE PLANS CRUD (Admin Only)
// ==========================================
router.get('/license-plans', verifyToken, allowedAdminOnly, getLicensePlans);
router.post('/license-plans', verifyToken, allowedAdminOnly, postLicensePlan);
router.put('/license-plans/:licenseId', verifyToken, allowedAdminOnly, putLicensePlan);
router.patch('/license-plans/:licenseId/status', verifyToken, allowedAdminOnly, patchLicensePlanStatus);
router.delete('/license-plans/:licenseId', verifyToken, allowedAdminOnly, deleteLicensePlan);

// ==========================================
// TRACK LICENSE OPTIONS CRUD (Admin/Producer)
// ==========================================
router.get('/tracks/:trackId/license-options', verifyToken, allowedManagers, getLicenseOptions);
router.post('/tracks/:trackId/license-options', verifyToken, allowedManagers, postLicenseOption);
router.put('/track-license-options/:licenseOptionId', verifyToken, allowedManagers, putLicenseOption);
router.patch('/track-license-options/:licenseOptionId/availability', verifyToken, allowedManagers, patchLicenseOptionAvailability);
router.delete('/track-license-options/:licenseOptionId', verifyToken, allowedManagers, deleteLicenseOption);

// ==========================================
// ADMIN INQUIRIES MANAGEMENT (Admin Only)
// ==========================================
/**
 * @swagger
 * /admin/inquiries:
 *   get:
 *     summary: Lấy danh sách yêu cầu mua nhạc (Admin Only)
 *     tags:
 *       - Admin Inquiries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái yêu cầu
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên khách hàng, email
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/inquiries', verifyToken, allowedAdminOnly, getInquiriesAdmin);

/**
 * @swagger
 * /admin/inquiries/{purchaseInquiryId}:
 *   get:
 *     summary: Xem chi tiết yêu cầu mua nhạc (Admin Only)
 *     tags:
 *       - Admin Inquiries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseInquiryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/inquiries/:purchaseInquiryId', verifyToken, allowedAdminOnly, getInquiryDetailAdmin);

/**
 * @swagger
 * /admin/inquiries/{purchaseInquiryId}/status:
 *   patch:
 *     summary: Cập nhật trạng thái yêu cầu mua nhạc (Admin Only)
 *     tags:
 *       - Admin Inquiries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseInquiryId
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
 *                 enum: [new, contacted, negotiating, waiting_payment, paid, delivered, closed, rejected]
 *                 example: "contacted"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/inquiries/:purchaseInquiryId/status', verifyToken, allowedAdminOnly, patchInquiryStatus);

/**
 * @swagger
 * /admin/inquiries/{purchaseInquiryId}/note:
 *   patch:
 *     summary: Cập nhật ghi chú của admin cho yêu cầu (Admin Only)
 *     tags:
 *       - Admin Inquiries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseInquiryId
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
 *               - admin_note
 *             properties:
 *               admin_note:
 *                 type: string
 *                 example: "Đã liên hệ qua điện thoại"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/inquiries/:purchaseInquiryId/note', verifyToken, allowedAdminOnly, patchInquiryNote);

// ==========================================
// ADMIN PURCHASES MANAGEMENT (Admin Only)
// ==========================================
/**
 * @swagger
 * /admin/purchases:
 *   get:
 *     summary: Lấy danh sách giao dịch (Admin Only)
 *     tags:
 *       - Admin Purchases
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/purchases', verifyToken, allowedAdminOnly, getPurchasesAdmin);

/**
 * @swagger
 * /admin/purchases:
 *   post:
 *     summary: Tạo giao dịch mua bán thủ công (Admin Only)
 *     tags:
 *       - Admin Purchases
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - track_id
 *               - license_name
 *               - final_price
 *             properties:
 *               inquiry_id:
 *                 type: integer
 *                 example: 1
 *               customer_id:
 *                 type: integer
 *                 example: 1
 *               track_id:
 *                 type: integer
 *                 example: 2
 *               license_option_id:
 *                 type: integer
 *                 example: 3
 *               license_name:
 *                 type: string
 *                 example: "Exclusive License"
 *               is_exclusive:
 *                 type: boolean
 *                 example: true
 *               final_price:
 *                 type: number
 *                 example: 5000000
 *               currency:
 *                 type: string
 *                 example: "VND"
 *               status:
 *                 type: string
 *                 enum: [pending, paid, delivered, completed, cancelled, refunded]
 *                 example: "pending"
 *               note:
 *                 type: string
 *                 example: "Giao dịch tạo thủ công"
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/purchases', verifyToken, allowedAdminOnly, postPurchaseAdmin);

/**
 * @swagger
 * /admin/purchases/{purchaseId}:
 *   get:
 *     summary: Xem chi tiết giao dịch (Admin Only)
 *     tags:
 *       - Admin Purchases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/purchases/:purchaseId', verifyToken, allowedAdminOnly, getPurchaseDetailAdmin);

/**
 * @swagger
 * /admin/purchases/{purchaseId}/status:
 *   patch:
 *     summary: Cập nhật trạng thái giao dịch (Admin Only)
 *     tags:
 *       - Admin Purchases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
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
 *                 enum: [pending, paid, delivered, completed, cancelled, refunded]
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/purchases/:purchaseId/status', verifyToken, allowedAdminOnly, patchPurchaseStatus);

/**
 * @swagger
 * /admin/purchases/{purchaseId}/delivery:
 *   patch:
 *     summary: Cập nhật hợp đồng và file bàn giao (Admin Only)
 *     tags:
 *       - Admin Purchases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contract_url:
 *                 type: string
 *                 example: "https://example.com/contract.pdf"
 *               delivered_file_url:
 *                 type: string
 *                 example: "https://example.com/master-track.zip"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/purchases/:purchaseId/delivery', verifyToken, allowedAdminOnly, patchPurchaseDelivery);

// ==========================================
// ADMIN DASHBOARD (Admin Only)
// ==========================================
/**
 * @swagger
 * /admin/dashboard/summary:
 *   get:
 *     summary: Lấy tổng quan số liệu thống kê (Admin Only)
 *     tags:
 *       - Admin Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/dashboard/summary', verifyToken, allowedAdminOnly, getSummary);

/**
 * @swagger
 * /admin/dashboard/top-tracks:
 *   get:
 *     summary: Lấy danh sách các bài hát hàng đầu (Admin Only)
 *     tags:
 *       - Admin Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [play_count, inquiry_count]
 *           default: play_count
 *         description: Sắp xếp theo lượt nghe hoặc lượt hỏi mua
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Giới hạn số lượng kết quả
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/dashboard/top-tracks', verifyToken, allowedAdminOnly, getTopTracks);

/**
 * @swagger
 * /admin/dashboard/revenue:
 *   get:
 *     summary: Lấy doanh thu theo thời gian (Admin Only)
 *     tags:
 *       - Admin Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/dashboard/revenue', verifyToken, allowedAdminOnly, getRevenue);

export default router;
