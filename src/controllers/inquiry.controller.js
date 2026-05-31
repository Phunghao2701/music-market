import * as inquiryService from '../services/inquiry.service.js';
import logger from '../utils/logger.js';

export const postInquiry = async (req, res) => {
  try {
    const result = await inquiryService.createInquiry(req.body);
    if (result.invalidPayload) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu mua nhạc thành công.',
      data: { inquiry: result.inquiry }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi tạo yêu cầu mua nhạc:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const getInquiryStatus = async (req, res) => {
  try {
    const { purchaseInquiryId } = req.params;
    const result = await inquiryService.getInquiryStatus(purchaseInquiryId);
    
    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin yêu cầu mua nhạc tương ứng.'
      });
    }

    return res.status(200).json({
      success: true,
      data: { inquiry: result.inquiry }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi lấy trạng thái yêu cầu mua nhạc ${req.params.purchaseInquiryId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};
