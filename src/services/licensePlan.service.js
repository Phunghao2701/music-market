import pool from '../config/database.js';
import { slugify } from '../utils/slugify.js';

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

/**
 * Fetch all license plans (both active and inactive) for admin
 */
export const getAllLicensePlans = async () => {
  const query = `
    SELECT 
      license_id, 
      license_name, 
      slug, 
      description, 
      usage_rights, 
      is_exclusive, 
      default_price, 
      currency,
      is_active,
      created_at
    FROM license_plans
    ORDER BY default_price ASC
  `;
  const result = await pool.query(query);
  return result.rows;
};

/**
 * Create a new license plan
 */
export const createLicensePlan = async (data) => {
  const {
    license_name,
    slug,
    description,
    usage_rights,
    is_exclusive = false,
    default_price = 0,
    currency = 'VND',
    is_active = true
  } = data;

  if (!license_name) {
    throw new Error('Tên gói license là bắt buộc.');
  }

  const targetSlug = slugify(slug || license_name);

  // Check unique slug
  const slugCheck = await pool.query('SELECT 1 FROM license_plans WHERE slug = $1', [targetSlug]);
  if (slugCheck.rows.length > 0) {
    return { slugExists: true };
  }

  const query = `
    INSERT INTO license_plans (
      license_name, slug, description, usage_rights, is_exclusive, default_price, currency, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING license_id, license_name, slug, description, usage_rights, is_exclusive, default_price, currency, is_active, created_at
  `;

  const res = await pool.query(query, [
    license_name.trim(),
    targetSlug,
    description || null,
    usage_rights || null,
    is_exclusive,
    parseFloat(default_price),
    currency.trim(),
    is_active
  ]);

  return { success: true, licensePlan: res.rows[0] };
};

/**
 * Update an existing license plan
 */
export const updateLicensePlan = async (licenseId, data) => {
  const parsedId = parseInt(licenseId, 10);
  
  // Verify plan exists
  const existsRes = await pool.query('SELECT 1 FROM license_plans WHERE license_id = $1', [parsedId]);
  if (existsRes.rows.length === 0) {
    return { notFound: true };
  }

  const {
    license_name,
    slug,
    description,
    usage_rights,
    is_exclusive,
    default_price,
    currency
  } = data;

  let targetSlug = null;
  if (slug || license_name) {
    targetSlug = slugify(slug || license_name);
    // Check slug uniqueness excluding self
    const slugCheck = await pool.query(
      'SELECT 1 FROM license_plans WHERE slug = $1 AND license_id <> $2',
      [targetSlug, parsedId]
    );
    if (slugCheck.rows.length > 0) {
      return { slugExists: true };
    }
  }

  const query = `
    UPDATE license_plans
    SET
      license_name = COALESCE($1, license_name),
      slug = COALESCE($2, slug),
      description = COALESCE($3, description),
      usage_rights = COALESCE($4, usage_rights),
      is_exclusive = COALESCE($5, is_exclusive),
      default_price = COALESCE($6, default_price),
      currency = COALESCE($7, currency)
    WHERE license_id = $8
    RETURNING license_id, license_name, slug, description, usage_rights, is_exclusive, default_price, currency, is_active, created_at
  `;

  const res = await pool.query(query, [
    license_name ? license_name.trim() : null,
    targetSlug,
    description || null,
    usage_rights || null,
    is_exclusive !== undefined ? is_exclusive : null,
    default_price !== undefined ? parseFloat(default_price) : null,
    currency ? currency.trim() : null,
    parsedId
  ]);

  return { success: true, licensePlan: res.rows[0] };
};

/**
 * Enable/Disable a license plan
 */
export const updateLicensePlanStatus = async (licenseId, isActive) => {
  const parsedId = parseInt(licenseId, 10);
  
  const existsRes = await pool.query('SELECT 1 FROM license_plans WHERE license_id = $1', [parsedId]);
  if (existsRes.rows.length === 0) {
    return { notFound: true };
  }

  const query = `
    UPDATE license_plans
    SET is_active = $1
    WHERE license_id = $2
    RETURNING license_id, license_name, slug, is_active
  `;

  const res = await pool.query(query, [!!isActive, parsedId]);
  return { success: true, licensePlan: res.rows[0] };
};

/**
 * Safe deactivation of a license plan (acts as delete)
 */
export const deleteLicensePlan = async (licenseId) => {
  const parsedId = parseInt(licenseId, 10);
  
  const existsRes = await pool.query('SELECT 1 FROM license_plans WHERE license_id = $1', [parsedId]);
  if (existsRes.rows.length === 0) {
    return { notFound: true };
  }

  // Deactivate
  const query = `
    UPDATE license_plans
    SET is_active = FALSE
    WHERE license_id = $1
    RETURNING license_id, license_name, slug, is_active
  `;
  const res = await pool.query(query, [parsedId]);

  return { success: true, licensePlan: res.rows[0] };
};
