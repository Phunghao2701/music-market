import * as catalogService from '../services/catalog.service.js';
import logger from '../utils/logger.js';

// Helper to map service status flags to Express JSON error responses
const handleCatalogResult = (res, result, type = 'bản ghi') => {
  if (result.notFound) {
    return res.status(404).json({
      success: false,
      message: `Không tìm thấy ${type} này.`
    });
  }
  if (result.forbidden) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện hành động này.'
    });
  }
  if (result.slugExists) {
    return res.status(400).json({
      success: false,
      message: 'Slug đã tồn tại. Vui lòng chọn tên hoặc slug khác.'
    });
  }
  if (result.invalidPayload) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu truyền lên không hợp lệ.'
    });
  }
  if (result.invalidCatalogIds) {
    return res.status(400).json({
      success: false,
      message: `Một hoặc nhiều ID ${type} liên kết không tồn tại trong hệ thống.`
    });
  }
  return null;
};

// ==========================================
// GENRE CONTROLLERS
// ==========================================

export const postGenre = async (req, res) => {
  try {
    const result = await catalogService.createGenre(req.body);
    const errorResponse = handleCatalogResult(res, result, 'thể loại');
    if (errorResponse) return errorResponse;

    return res.status(201).json({
      success: true,
      message: 'Tạo thể loại mới thành công.',
      data: { genre: result.genre }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi tạo thể loại:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const putGenre = async (req, res) => {
  try {
    const { genreId } = req.params;
    const result = await catalogService.updateGenre(genreId, req.body);
    const errorResponse = handleCatalogResult(res, result, 'thể loại');
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thể loại thành công.',
      data: { genre: result.genre }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi cập nhật thể loại ${req.params.genreId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const deleteGenre = async (req, res) => {
  try {
    const { genreId } = req.params;
    const result = await catalogService.deleteGenre(genreId);
    const errorResponse = handleCatalogResult(res, result, 'thể loại');
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Xóa thể loại thành công.'
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi xóa thể loại ${req.params.genreId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

// ==========================================
// MOOD CONTROLLERS
// ==========================================

export const postMood = async (req, res) => {
  try {
    const result = await catalogService.createMood(req.body);
    const errorResponse = handleCatalogResult(res, result, 'cảm xúc');
    if (errorResponse) return errorResponse;

    return res.status(201).json({
      success: true,
      message: 'Tạo cảm xúc mới thành công.',
      data: { mood: result.mood }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi tạo cảm xúc:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const putMood = async (req, res) => {
  try {
    const { moodId } = req.params;
    const result = await catalogService.updateMood(moodId, req.body);
    const errorResponse = handleCatalogResult(res, result, 'cảm xúc');
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật cảm xúc thành công.',
      data: { mood: result.mood }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi cập nhật cảm xúc ${req.params.moodId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const deleteMood = async (req, res) => {
  try {
    const { moodId } = req.params;
    const result = await catalogService.deleteMood(moodId);
    const errorResponse = handleCatalogResult(res, result, 'cảm xúc');
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Xóa cảm xúc thành công.'
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi xóa cảm xúc ${req.params.moodId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

// ==========================================
// TAG CONTROLLERS
// ==========================================

export const postTag = async (req, res) => {
  try {
    const result = await catalogService.createTag(req.body);
    const errorResponse = handleCatalogResult(res, result, 'từ khóa');
    if (errorResponse) return errorResponse;

    return res.status(201).json({
      success: true,
      message: 'Tạo từ khóa mới thành công.',
      data: { tag: result.tag }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi tạo từ khóa:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const putTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const result = await catalogService.updateTag(tagId, req.body);
    const errorResponse = handleCatalogResult(res, result, 'từ khóa');
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật từ khóa thành công.',
      data: { tag: result.tag }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi cập nhật từ khóa ${req.params.tagId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const deleteTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const result = await catalogService.deleteTag(tagId);
    const errorResponse = handleCatalogResult(res, result, 'từ khóa');
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Xóa từ khóa thành công.'
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi xóa từ khóa ${req.params.tagId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

// ==========================================
// TRACK RELATION ASSIGNMENT CONTROLLERS
// ==========================================

export const putTrackGenres = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { genre_ids } = req.body;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await catalogService.assignGenresToTrack(trackId, user, genre_ids);
    const errorResponse = handleCatalogResult(res, result, 'thể loại');
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Gắn danh sách thể loại cho bài nhạc thành công.'
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi gắn genres cho trackId ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const putTrackMoods = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { mood_ids } = req.body;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await catalogService.assignMoodsToTrack(trackId, user, mood_ids);
    const errorResponse = handleCatalogResult(res, result, 'cảm xúc');
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Gắn danh sách cảm xúc cho bài nhạc thành công.'
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi gắn moods cho trackId ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const putTrackTags = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { tag_ids } = req.body;
    const user = { user_id: req.user.user_id, role: req.user.role };

    const result = await catalogService.assignTagsToTrack(trackId, user, tag_ids);
    const errorResponse = handleCatalogResult(res, result, 'từ khóa');
    if (errorResponse) return errorResponse;

    return res.status(200).json({
      success: true,
      message: 'Gắn danh sách từ khóa cho bài nhạc thành công.'
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi gắn tags cho trackId ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};
