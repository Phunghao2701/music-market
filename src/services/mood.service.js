import pool from '../config/database.js';

/**
 * Fetch all moods sorted alphabetically by name
 * @returns {Promise<Array>} List of moods
 */
export const getAllMoods = async () => {
  const query = `
    SELECT mood_id, mood_name, slug
    FROM moods
    ORDER BY mood_name ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};
