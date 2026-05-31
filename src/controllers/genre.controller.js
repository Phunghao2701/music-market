import * as genreService from '../services/genre.service.js';
import logger from '../utils/logger.js';

/**
 * GET all genres
 */
export const getGenres = async (req, res) => {
  try {
    const genres = await genreService.getAllGenres();
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách thể loại nhạc thành công',
      data: { genres }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi lấy danh sách thể loại:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server'
    });
  }
};
