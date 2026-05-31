import * as purchaseService from '../services/purchase.service.js';
import logger from '../utils/logger.js';

export const getPurchasesAdmin = async (req, res) => {
  try {
    const purchases = await purchaseService.listPurchasesAdmin();
    return res.status(200).json({
      success: true,
      data: { purchases }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi admin lấy danh sách giao dịch:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const getPurchaseDetailAdmin = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const result = await purchaseService.getPurchaseDetailAdmin(purchaseId);
    
    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi tiết giao dịch.'
      });
    }

    return res.status(200).json({
      success: true,
      data: { purchase: result.purchase }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi admin lấy chi tiết giao dịch ${req.params.purchaseId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const postPurchaseAdmin = async (req, res) => {
  try {
    const result = await purchaseService.createPurchaseAdmin(req.body);
    
    if (result.invalidPayload) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Tạo giao dịch thành công.',
      data: { purchase: result.purchase }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi admin tạo giao dịch:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const patchPurchaseStatus = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { status } = req.body;

    const result = await purchaseService.updatePurchaseStatus(purchaseId, status);
    
    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch để cập nhật.'
      });
    }

    if (result.invalidPayload) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái giao dịch thành công.',
      data: { purchase: result.purchase }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi admin cập nhật trạng thái giao dịch ${req.params.purchaseId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const patchPurchaseDelivery = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { contract_url, delivered_file_url } = req.body;

    const result = await purchaseService.updatePurchaseDelivery(purchaseId, { contract_url, delivered_file_url });
    
    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch để cập nhật thông tin bàn giao.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin bàn giao giao dịch thành công.',
      data: { purchase: result.purchase }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi admin cập nhật thông tin bàn giao giao dịch ${req.params.purchaseId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};
