import * as moodService from '../services/mood.service.js';
import logger from '../utils/logger.js';

/**
 * GET all moods
 */
export const getMoods = async (req, res) => {
  try {
    const moods = await moodService.getAllMoods();
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách mood/cảm xúc thành công',
      data: { moods }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi lấy danh sách moods:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server'
    });
  }
};
