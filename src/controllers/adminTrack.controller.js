import * as adminTrackService from '../services/adminTrack.service.js';
import logger from '../utils/logger.js';

// Helper response mapper for errors in service calls
const handleServiceResult = (res, result) => {
  if (result.notFound) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy bài nhạc này.'
    });
  }
  if (result.forbidden) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện hành động này với bài nhạc.'
    });
  }
  if (result.slugExists) {
    return res.status(400).json({
      success: false,
      message: 'Slug bài nhạc đã tồn tại. Vui lòng chọn tiêu đề hoặc slug khác.'
    });
  }
  if (result.invalidStatus) {
    return res.status(400).json({
      success: false,
      message: 'Trạng thái bài nhạc không hợp lệ.'
    });
  }
  return null;
};

/**
 * GET - List all tracks for admin / producer
 */
export const getTracks = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const data = await adminTrackService.listTracks(user, { page, limit });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách quản lý bài nhạc thành công.',
      data
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi quản lý lấy danh sách bài nhạc:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

/**
 * POST - Create a new track
 */
export const createTrack = async (req, res) => {
  try {
    const ownerId = req.user.user_id;
    const result = await adminTrackService.createTrack(ownerId, req.body);

    const errorResponse = handleServiceResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(201).json({
      success: true,
      message: 'Tạo bài nhạc mới thành công.',
      data: { track: result.track }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi tạo bài nhạc:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

/**
 * GET - View track details in admin
 */
export const getTrackById = async (req, res) => {
  try {
    const { trackId } = req.params;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await adminTrackService.getTrackById(trackId, user);

    const errorResponse = handleServiceResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết quản lý bài nhạc thành công.',
      data: { track: result.track }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi lấy chi tiết quản lý bài nhạc cho trackId ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

/**
 * PUT - Update track
 */
export const updateTrack = async (req, res) => {
  try {
    const { trackId } = req.params;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await adminTrackService.updateTrack(trackId, user, req.body);

    const errorResponse = handleServiceResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin bài nhạc thành công.',
      data: { track: result.track }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi cập nhật bài nhạc cho trackId ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

/**
 * PATCH - Update status
 */
export const updateStatus = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { status } = req.body;
    const user = { user_id: req.user.user_id, role: req.user.role };

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái status là bắt buộc.'
      });
    }

    const result = await adminTrackService.updateTrackStatus(trackId, user, status);

    const errorResponse = handleServiceResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái bài nhạc thành công.',
      data: { track: result.track }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi đổi trạng thái bài nhạc cho trackId ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

/**
 * PATCH - Publish track
 */
export const publishTrack = async (req, res) => {
  try {
    const { trackId } = req.params;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await adminTrackService.publishTrack(trackId, user);

    const errorResponse = handleServiceResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Publish bài nhạc thành công.',
      data: { track: result.track }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi publish bài nhạc cho trackId ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

/**
 * DELETE - Soft delete track
 */
export const deleteTrack = async (req, res) => {
  try {
    const { trackId } = req.params;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await adminTrackService.softDeleteTrack(trackId, user);

    const errorResponse = handleServiceResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Xóa mềm bài nhạc thành công.'
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi xóa bài nhạc cho trackId ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};
