import * as licensePlanService from '../services/licensePlan.service.js';
import logger from '../utils/logger.js';

// Helper to map license service response flags to standard REST JSON errors
const handleLicenseResult = (res, result) => {
  if (result.notFound) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy gói license plan tương ứng.'
    });
  }
  if (result.slugExists) {
    return res.status(400).json({
      success: false,
      message: 'Slug gói license đã tồn tại. Vui lòng chọn tên hoặc slug khác.'
    });
  }
  return null;
};

export const getLicensePlans = async (req, res) => {
  try {
    const plans = await licensePlanService.getAllLicensePlans();
    return res.status(200).json({
      success: true,
      data: { license_plans: plans }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi lấy danh sách license plans quản trị:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const postLicensePlan = async (req, res) => {
  try {
    const result = await licensePlanService.createLicensePlan(req.body);
    const errorResponse = handleLicenseResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(201).json({
      success: true,
      message: 'Tạo gói license plan mới thành công.',
      data: { license_plan: result.licensePlan }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi tạo gói license plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const putLicensePlan = async (req, res) => {
  try {
    const { licenseId } = req.params;
    const result = await licensePlanService.updateLicensePlan(licenseId, req.body);
    const errorResponse = handleLicenseResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật gói license plan thành công.',
      data: { license_plan: result.licensePlan }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi cập nhật gói license plan ${req.params.licenseId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const patchLicensePlanStatus = async (req, res) => {
  try {
    const { licenseId } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu trường is_active trong body.'
      });
    }

    const result = await licensePlanService.updateLicensePlanStatus(licenseId, is_active);
    const errorResponse = handleLicenseResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: `${result.licensePlan.is_active ? 'Bật' : 'Tắt'} gói license plan thành công.`,
      data: { license_plan: result.licensePlan }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi thay đổi trạng thái gói license plan ${req.params.licenseId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const deleteLicensePlan = async (req, res) => {
  try {
    const { licenseId } = req.params;
    const result = await licensePlanService.deleteLicensePlan(licenseId);
    const errorResponse = handleLicenseResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Xóa (ngừng hoạt động) gói license plan thành công.',
      data: { license_plan: result.licensePlan }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi xóa gói license plan ${req.params.licenseId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};
