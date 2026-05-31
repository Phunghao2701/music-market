import * as trackLicenseService from '../services/trackLicenseOption.service.js';
import logger from '../utils/logger.js';

// Helper to map option service response flags to standard REST JSON errors
const handleOptionResult = (res, result) => {
  if (result.notFound) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy bài nhạc hoặc gói cấu hình license option tương ứng.'
    });
  }
  if (result.forbidden) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện hành động này.'
    });
  }
  if (result.planNotFound) {
    return res.status(404).json({
      success: false,
      message: 'Gói license mẫu không tồn tại trong hệ thống.'
    });
  }
  if (result.duplicatePlan) {
    return res.status(400).json({
      success: false,
      message: 'Gói license mẫu này đã được cấu hình cho bài nhạc trước đó.'
    });
  }
  if (result.invalidPayload) {
    return res.status(400).json({
      success: false,
      message: result.message || 'Dữ liệu truyền lên không hợp lệ.'
    });
  }
  return null;
};

export const getLicenseOptions = async (req, res) => {
  try {
    const { trackId } = req.params;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await trackLicenseService.listLicenseOptions(trackId, user);
    const errorResponse = handleOptionResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      data: { license_options: result.licenseOptions }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi lấy license options của track ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const postLicenseOption = async (req, res) => {
  try {
    const { trackId } = req.params;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await trackLicenseService.addLicenseOption(trackId, user, req.body);
    const errorResponse = handleOptionResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(201).json({
      success: true,
      message: 'Cấu hình gói license option cho track thành công.',
      data: { license_option: result.licenseOption }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi thêm license option vào track ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const putLicenseOption = async (req, res) => {
  try {
    const { licenseOptionId } = req.params;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await trackLicenseService.updateLicenseOption(licenseOptionId, user, req.body);
    const errorResponse = handleOptionResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật cấu hình gói license option thành công.',
      data: { license_option: result.licenseOption }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi cập nhật license option ${req.params.licenseOptionId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const patchLicenseOptionAvailability = async (req, res) => {
  try {
    const { licenseOptionId } = req.params;
    const { is_available } = req.body;
    const user = { user_id: req.user.user_id, role: req.user.role };

    if (is_available === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu trường is_available trong body.'
      });
    }

    const result = await trackLicenseService.updateLicenseOptionAvailability(licenseOptionId, user, is_available);
    const errorResponse = handleOptionResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: `${result.licenseOption.is_available ? 'Bật' : 'Tắt'} gói license option thành công.`,
      data: { license_option: result.licenseOption }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi đổi trạng thái hiển thị của license option ${req.params.licenseOptionId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const deleteLicenseOption = async (req, res) => {
  try {
    const { licenseOptionId } = req.params;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await trackLicenseService.deleteLicenseOption(licenseOptionId, user);
    const errorResponse = handleOptionResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Xóa cấu hình gói license option khỏi track thành công.'
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi xóa license option ${req.params.licenseOptionId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};
