import * as tagService from '../services/tag.service.js';
import logger from '../utils/logger.js';

/**
 * GET all tags
 */
export const getTags = async (req, res) => {
  try {
    const tags = await tagService.getAllTags();
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách tag thành công',
      data: { tags }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi lấy danh sách tags:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server'
    });
  }
};
