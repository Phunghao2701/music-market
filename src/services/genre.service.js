import pool from '../config/database.js';

/**
 * Fetch all genres sorted alphabetically by name
 * @returns {Promise<Array>} List of genres
 */
export const getAllGenres = async () => {
  const query = `
    SELECT genre_id, genre_name, slug
    FROM genres
    ORDER BY genre_name ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};
