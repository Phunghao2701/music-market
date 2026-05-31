import pool from '../config/database.js';

/**
 * Fetch all active license plans sorted by price ascending
 * @returns {Promise<Array>} List of active license plans
 */
export const getActiveLicensePlans = async () => {
  const query = `
    SELECT 
      license_id, 
      license_name, 
      slug, 
      description, 
      usage_rights, 
      is_exclusive, 
      default_price, 
      currency
    FROM license_plans
    WHERE is_active = TRUE
    ORDER BY default_price ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};
