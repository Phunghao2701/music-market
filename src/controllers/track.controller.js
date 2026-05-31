import * as trackService from '../services/track.service.js';
import logger from '../utils/logger.js';

/**
 * GET published tracks list (with search, filter, and pagination)
 */
export const getTracks = async (req, res) => {
  try {
    const filters = {
      genre: req.query.genre,
      mood: req.query.mood,
      tag: req.query.tag,
      bpm_min: req.query.bpm_min,
      bpm_max: req.query.bpm_max,
      musical_key: req.query.musical_key,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };

    const data = await trackService.getPublishedTracks(filters);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách bài nhạc thành công',
      data
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi lấy danh sách bài nhạc:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server'
    });
  }
};

/**
 * GET single track detail by slug (increments view count)
 */
export const getTrackDetails = async (req, res) => {
  try {
    const { slug } = req.params;
    const track = await trackService.getTrackBySlug(slug);

    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài nhạc này hoặc bài nhạc không công khai'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết bài nhạc thành công',
      data: { track }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi lấy chi tiết bài nhạc (${req.params.slug}):`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server'
    });
  }
};

/**
 * GET featured tracks list
 */
export const getFeatured = async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const tracks = await trackService.getFeaturedTracks(limit);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách bài nhạc nổi bật thành công',
      data: { tracks }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi lấy bài nhạc nổi bật:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server'
    });
  }
};

/**
 * GET related tracks based on catalog relations
 */
export const getRelated = async (req, res) => {
  try {
    const { trackId } = req.params;
    const limit = req.query.limit || 5;

    const tracks = await trackService.getRelatedTracks(trackId, limit);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách bài nhạc liên quan thành công',
      data: { tracks }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi lấy bài nhạc liên quan cho trackId ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server'
    });
  }
};
