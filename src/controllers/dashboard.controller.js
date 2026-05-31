import * as dashboardService from '../services/dashboard.service.js';
import logger from '../utils/logger.js';

export const getSummary = async (req, res) => {
  try {
    const summary = await dashboardService.getSummaryMetrics();
    return res.status(200).json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi admin lấy tổng quan dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const getTopTracks = async (req, res) => {
  try {
    const { sortBy = 'play_count', limit = 10 } = req.query;
    
    if (sortBy !== 'play_count' && sortBy !== 'inquiry_count') {
      return res.status(400).json({
        success: false,
        message: "Giá trị sortBy không hợp lệ. Chỉ chấp nhận 'play_count' hoặc 'inquiry_count'."
      });
    }

    const topTracks = await dashboardService.getTopTracks(sortBy, limit);
    return res.status(200).json({
      success: true,
      data: { topTracks }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi admin lấy top tracks:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};

export const getRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Optional validation for date format
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({
        success: false,
        message: 'startDate không đúng định dạng ngày tháng.'
      });
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({
        success: false,
        message: 'endDate không đúng định dạng ngày tháng.'
      });
    }

    const revenue = await dashboardService.getRevenueSeries(startDate, endDate);
    return res.status(200).json({
      success: true,
      data: { revenue }
    });
  } catch (error) {
    logger.error('Lỗi hệ thống khi admin lấy doanh thu theo thời gian:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra ở server.'
    });
  }
};
