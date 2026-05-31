import * as licensePlanService from '../services/licensePlan.service.js';
import logger from '../utils/logger.js';

/**
 * GET all active license plans
 */
export const getLicensePlans = async (req, res) => {
  try {
    const licensePlans = await licensePlanService.getActiveLicensePlans();
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách gói license thành công',
      data: { licensePlans }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi lấy danh sách license plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server'
    });
  }
};
