import pool from '../config/database.js';

/**
 * Retrieve total_tracks, published_tracks, new_inquiries, completed_purchases, and total_revenue
 */
export const getSummaryMetrics = async () => {
  const queries = {
    total_tracks: 'SELECT COUNT(*)::int AS count FROM tracks',
    published_tracks: "SELECT COUNT(*)::int AS count FROM tracks WHERE status = 'published'",
    new_inquiries: "SELECT COUNT(*)::int AS count FROM purchase_inquiries WHERE status = 'new'",
    completed_purchases: "SELECT COUNT(*)::int AS count FROM purchases WHERE status = 'completed'",
    total_revenue: "SELECT COALESCE(SUM(final_price), 0)::numeric AS sum FROM purchases WHERE status = 'completed'"
  };

  const results = await Promise.all([
    pool.query(queries.total_tracks),
    pool.query(queries.published_tracks),
    pool.query(queries.new_inquiries),
    pool.query(queries.completed_purchases),
    pool.query(queries.total_revenue)
  ]);

  return {
    total_tracks: results[0].rows[0].count,
    published_tracks: results[1].rows[0].count,
    new_inquiries: results[2].rows[0].count,
    completed_purchases: results[3].rows[0].count,
    total_revenue: parseFloat(results[4].rows[0].sum)
  };
};

/**
 * Retrieve top tracks sorted by play_count or inquiry_count
 */
export const getTopTracks = async (sortBy = 'play_count', limit = 10) => {
  const orderCol = sortBy === 'inquiry_count' ? 'inquiry_count' : 'play_count';
  const parsedLimit = parseInt(limit, 10) || 10;

  const sql = `
    SELECT 
      track_id, 
      title, 
      slug, 
      play_count, 
      inquiry_count, 
      cover_image_url, 
      status, 
      created_at
    FROM tracks
    ORDER BY ${orderCol} DESC, created_at DESC
    LIMIT $1
  `;

  const result = await pool.query(sql, [parsedLimit]);
  return result.rows;
};

/**
 * Retrieve revenue time series grouped by date
 */
export const getRevenueSeries = async (startDate, endDate) => {
  let sql = `
    SELECT 
      DATE(completed_at) AS date,
      COALESCE(SUM(final_price), 0)::numeric AS revenue
    FROM purchases
    WHERE status = 'completed'
  `;
  const params = [];

  if (startDate) {
    params.push(new Date(startDate));
    sql += ` AND completed_at >= $${params.length}`;
  }
  if (endDate) {
    // Add 1 day or filter up to the end of the day
    const parsedEnd = new Date(endDate);
    parsedEnd.setHours(23, 59, 59, 999);
    params.push(parsedEnd);
    sql += ` AND completed_at <= $${params.length}`;
  }

  sql += `
    GROUP BY DATE(completed_at)
    ORDER BY date ASC
  `;

  const result = await pool.query(sql, params);
  
  return result.rows.map(row => {
    // format date as YYYY-MM-DD
    let dateStr = null;
    if (row.date) {
      const d = new Date(row.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    }
    return {
      date: dateStr,
      revenue: parseFloat(row.revenue)
    };
  });
};
