import pool from '../config/database.js';

/**
 * Record a public track play event and atomically increment track play count
 */
export const recordPlayEvent = async (trackId, data) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { played_seconds, ip_address, user_agent, referrer } = data;

  // 1. Verify track exists, is published, and not deleted
  const trackRes = await pool.query(
    `SELECT 1 FROM tracks WHERE track_id = $1 AND status = 'published' AND deleted_at IS NULL`,
    [parsedTrackId]
  );
  if (trackRes.rows.length === 0) {
    return null;
  }

  // 2. Insert into track_play_events
  const insertQuery = `
    INSERT INTO track_play_events (track_id, played_seconds, ip_address, user_agent, referrer)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING play_id, track_id, played_seconds, ip_address, user_agent, referrer, created_at
  `;
  const insertResult = await pool.query(insertQuery, [
    parsedTrackId,
    parseInt(played_seconds || 0, 10),
    ip_address || null,
    user_agent || null,
    referrer || null
  ]);

  // 3. Atomically increment play_count in tracks table
  await pool.query(
    `UPDATE tracks SET play_count = play_count + 1 WHERE track_id = $1`,
    [parsedTrackId]
  );

  return insertResult.rows[0];
};

/**
 * Fetch play event history log for a specific track (with pagination)
 */
export const getTrackPlayEvents = async (trackId, options = {}) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { page = 1, limit = 50 } = options;

  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.max(1, parseInt(limit, 10));
  const offset = (parsedPage - 1) * parsedLimit;

  // Verify track exists
  const trackRes = await pool.query(`SELECT title FROM tracks WHERE track_id = $1`, [parsedTrackId]);
  if (trackRes.rows.length === 0) {
    return null;
  }
  const trackTitle = trackRes.rows[0].title;

  // 1. Count query
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM track_play_events WHERE track_id = $1`,
    [parsedTrackId]
  );
  const total = parseInt(countRes.rows[0].count, 10);

  // 2. List query
  const listQuery = `
    SELECT play_id, customer_id, played_seconds, ip_address, user_agent, referrer, created_at
    FROM track_play_events
    WHERE track_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const listRes = await pool.query(listQuery, [parsedTrackId, parsedLimit, offset]);

  return {
    track: {
      track_id: parsedTrackId,
      title: trackTitle
    },
    events: listRes.rows,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit)
    }
  };
};
