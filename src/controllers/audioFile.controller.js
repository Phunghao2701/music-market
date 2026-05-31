import * as audioFileService from '../services/audioFile.service.js';
import logger from '../utils/logger.js';

// Helper to map service response flags to standard REST API JSON errors
const handleAudioResult = (res, result) => {
  if (result.notFound) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy bài nhạc hoặc file âm thanh tương ứng.'
    });
  }
  if (result.forbidden) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện hành động này.'
    });
  }
  if (result.invalidPayload) {
    return res.status(400).json({
      success: false,
      message: result.message || 'Dữ liệu truyền lên không hợp lệ.'
    });
  }
  if (result.invalidFileType) {
    return res.status(400).json({
      success: false,
      message: 'Định dạng file_type không hợp lệ.'
    });
  }
  return null;
};

export const getAudioFiles = async (req, res) => {
  try {
    const { trackId } = req.params;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await audioFileService.listAudioFiles(trackId, user);
    const errorResponse = handleAudioResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      data: { audio_files: result.audioFiles }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi lấy audio files của track ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const postAudioFile = async (req, res) => {
  try {
    const { trackId } = req.params;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await audioFileService.addAudioFile(trackId, user, req.body);
    const errorResponse = handleAudioResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(201).json({
      success: true,
      message: 'Thêm audio file cho track thành công.',
      data: { audio_file: result.audioFile }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi thêm audio file vào track ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const putAudioFile = async (req, res) => {
  try {
    const { audioId } = req.params;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await audioFileService.updateAudioFile(audioId, user, req.body);
    const errorResponse = handleAudioResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật audio file thành công.',
      data: { audio_file: result.audioFile }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi cập nhật audio file ${req.params.audioId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const deleteAudioFile = async (req, res) => {
  try {
    const { audioId } = req.params;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await audioFileService.deleteAudioFile(audioId, user);
    const errorResponse = handleAudioResult(res, result);
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Xóa audio file thành công.'
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi xóa audio file ${req.params.audioId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};
