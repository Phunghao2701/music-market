import pool from '../config/database.js';

/**
 * Fetch all tags sorted alphabetically by name
 * @returns {Promise<Array>} List of tags
 */
export const getAllTags = async () => {
  const query = `
    SELECT tag_id, tag_name, slug
    FROM tags
    ORDER BY tag_name ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};
