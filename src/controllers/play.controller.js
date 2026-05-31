import * as playService from '../services/play.service.js';
import logger from '../utils/logger.js';

/**
 * POST - Record a new track play event (public)
 */
export const postPlayEvent = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { played_seconds, listener_session_id } = req.body;

    // Validation: played_seconds must be a non-negative integer
    if (played_seconds === undefined || played_seconds === null) {
      return res.status(400).json({
        success: false,
        message: 'Trường played_seconds là bắt buộc.'
      });
    }

    const seconds = parseInt(played_seconds, 10);
    if (isNaN(seconds) || seconds < 0) {
      return res.status(400).json({
        success: false,
        message: 'Thời lượng nghe played_seconds không được âm.'
      });
    }

    // Capture metadata headers
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const user_agent = req.headers['user-agent'];
    const referrer = req.headers['referer'] || req.headers['referrer'];

    const event = await playService.recordPlayEvent(trackId, {
      played_seconds: seconds,
      listener_session_id,
      ip_address,
      user_agent,
      referrer
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài nhạc hoặc bài nhạc không công khai.'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Ghi nhận lượt nghe demo thành công.',
      data: { event }
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi ghi nhận lượt nghe cho trackId ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

/**
 * GET - Admin views history log of track play events
 */
export const getPlayEvents = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { page, limit } = req.query;

    const data = await playService.getTrackPlayEvents(trackId, { page, limit });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài nhạc này.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy lịch sử lượt nghe của bài nhạc thành công.',
      data
    });
  } catch (error) {
    logger.error(`Lỗi hệ thống khi lấy lịch sử lượt nghe cho trackId ${req.params.trackId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};
