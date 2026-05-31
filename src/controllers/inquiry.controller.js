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

export const getInquiriesAdmin = async (req, res) => {
  try {
    const { status, search } = req.query;
    const inquiries = await inquiryService.listInquiriesAdmin({ status, search });
    
    return res.status(200).json({
      success: true,
      data: { inquiries }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi admin lấy danh sách yêu cầu mua nhạc:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const getInquiryDetailAdmin = async (req, res) => {
  try {
    const { purchaseInquiryId } = req.params;
    const result = await inquiryService.getInquiryDetailAdmin(purchaseInquiryId);
    
    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi tiết yêu cầu mua nhạc.'
      });
    }

    return res.status(200).json({
      success: true,
      data: { inquiry: result.inquiry }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi admin lấy chi tiết yêu cầu mua nhạc ${req.params.purchaseInquiryId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const patchInquiryStatus = async (req, res) => {
  try {
    const { purchaseInquiryId } = req.params;
    const { status } = req.body;
    
    const result = await inquiryService.updateInquiryStatus(purchaseInquiryId, status);
    
    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu mua nhạc để cập nhật.'
      });
    }
    
    if (result.invalidStatus) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái yêu cầu mua nhạc thành công.',
      data: { inquiry: result.inquiry }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi admin cập nhật trạng thái yêu cầu mua nhạc ${req.params.purchaseInquiryId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const patchInquiryNote = async (req, res) => {
  try {
    const { purchaseInquiryId } = req.params;
    const { admin_note } = req.body;
    
    const result = await inquiryService.updateInquiryNote(purchaseInquiryId, admin_note);
    
    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu mua nhạc để cập nhật ghi chú.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật ghi chú của admin thành công.',
      data: { inquiry: result.inquiry }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi admin cập nhật ghi chú yêu cầu mua nhạc ${req.params.purchaseInquiryId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};
