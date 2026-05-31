import express from 'express';
import { postInquiry, getInquiryStatus } from '../controllers/inquiry.controller.js';

const router = express.Router();

// Public endpoints
router.post('/', postInquiry);
router.get('/:purchaseInquiryId/status', getInquiryStatus);

export default router;
