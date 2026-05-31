import pool from '../config/database.js';

/**
 * Health service to handle DB checks
 */
export const getDatabaseTime = async () => {
  const result = await pool.query('SELECT NOW() as current_time');
  return result.rows[0].current_time;
};
