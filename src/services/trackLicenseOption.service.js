import pool from '../config/database.js';
import { checkOwnership } from './adminTrack.service.js';

/**
 * List license options of a track
 */
export const listLicenseOptions = async (trackId, user) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { user_id, role } = user;

  // 1. Verify access
  const access = await checkOwnership(parsedTrackId, user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  // 2. Query options joined with license plans
  const query = `
    SELECT 
      o.license_option_id,
      o.track_id,
      o.license_plan_id,
      o.price,
      o.currency,
      o.is_available,
      o.custom_terms,
      o.created_at,
      p.license_name,
      p.slug AS license_slug,
      p.description AS license_description,
      p.usage_rights AS license_usage_rights,
      p.is_exclusive
    FROM track_license_options o
    JOIN license_plans p ON o.license_plan_id = p.license_id
    WHERE o.track_id = $1
    ORDER BY o.price ASC
  `;
  const res = await pool.query(query, [parsedTrackId]);

  return { success: true, licenseOptions: res.rows };
};

/**
 * Add license option to track
 */
export const addLicenseOption = async (trackId, user, data) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { user_id, role } = user;

  // 1. Verify access
  const access = await checkOwnership(parsedTrackId, user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  const {
    license_plan_id,
    price,
    currency = 'VND',
    is_available = true,
    custom_terms
  } = data;

  if (!license_plan_id) {
    return { invalidPayload: true, message: 'Thiếu trường license_plan_id.' };
  }

  const parsedPlanId = parseInt(license_plan_id, 10);

  // 2. Validate selected plan template
  const planCheck = await pool.query(
    'SELECT default_price, currency, is_active FROM license_plans WHERE license_id = $1',
    [parsedPlanId]
  );
  if (planCheck.rows.length === 0) {
    return { planNotFound: true };
  }
  const plan = planCheck.rows[0];

  // 3. Prevent duplicate plans on same track
  const dupCheck = await pool.query(
    'SELECT 1 FROM track_license_options WHERE track_id = $1 AND license_plan_id = $2',
    [parsedTrackId, parsedPlanId]
  );
  if (dupCheck.rows.length > 0) {
    return { duplicatePlan: true };
  }

  // Resolve price (fallback to default_price if null/undefined)
  const targetPrice = price !== undefined && price !== null ? parseFloat(price) : parseFloat(plan.default_price);
  const targetCurrency = currency || plan.currency;

  // 4. Insert option
  const insertQuery = `
    INSERT INTO track_license_options (
      track_id, license_plan_id, price, currency, is_available, custom_terms
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING license_option_id, track_id, license_plan_id, price, currency, is_available, custom_terms, created_at
  `;

  const res = await pool.query(insertQuery, [
    parsedTrackId,
    parsedPlanId,
    targetPrice,
    targetCurrency.trim(),
    !!is_available,
    custom_terms || null
  ]);

  return { success: true, licenseOption: res.rows[0] };
};

/**
 * Update an existing track license option
 */
export const updateLicenseOption = async (optionId, user, data) => {
  const parsedOptionId = parseInt(optionId, 10);
  const { user_id, role } = user;

  // 1. Find option and track
  const findRes = await pool.query(
    'SELECT track_id FROM track_license_options WHERE license_option_id = $1',
    [parsedOptionId]
  );
  if (findRes.rows.length === 0) {
    return { notFound: true };
  }
  const trackId = findRes.rows[0].track_id;

  // 2. Verify access
  const access = await checkOwnership(parseInt(trackId, 10), user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  const {
    price,
    currency,
    is_available,
    custom_terms
  } = data;

  // 3. Update record
  const updateQuery = `
    UPDATE track_license_options
    SET
      price = COALESCE($1, price),
      currency = COALESCE($2, currency),
      is_available = COALESCE($3, is_available),
      custom_terms = COALESCE($4, custom_terms)
    WHERE license_option_id = $5
    RETURNING license_option_id, track_id, license_plan_id, price, currency, is_available, custom_terms, created_at
  `;

  const res = await pool.query(updateQuery, [
    price !== undefined && price !== null ? parseFloat(price) : null,
    currency ? currency.trim() : null,
    is_available !== undefined ? !!is_available : null,
    custom_terms || null,
    parsedOptionId
  ]);

  return { success: true, licenseOption: res.rows[0] };
};

/**
 * Patch availability status of a track license option
 */
export const updateLicenseOptionAvailability = async (optionId, user, isAvailable) => {
  const parsedOptionId = parseInt(optionId, 10);
  const { user_id, role } = user;

  // 1. Find option
  const findRes = await pool.query(
    'SELECT track_id FROM track_license_options WHERE license_option_id = $1',
    [parsedOptionId]
  );
  if (findRes.rows.length === 0) {
    return { notFound: true };
  }
  const trackId = findRes.rows[0].track_id;

  // 2. Verify access
  const access = await checkOwnership(parseInt(trackId, 10), user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  // 3. Update status
  const query = `
    UPDATE track_license_options
    SET is_available = $1
    WHERE license_option_id = $2
    RETURNING license_option_id, track_id, license_plan_id, is_available, created_at
  `;
  const res = await pool.query(query, [!!isAvailable, parsedOptionId]);

  return { success: true, licenseOption: res.rows[0] };
};

/**
 * Delete a track license option
 */
export const deleteLicenseOption = async (optionId, user) => {
  const parsedOptionId = parseInt(optionId, 10);
  const { user_id, role } = user;

  // 1. Find option
  const findRes = await pool.query(
    'SELECT track_id FROM track_license_options WHERE license_option_id = $1',
    [parsedOptionId]
  );
  if (findRes.rows.length === 0) {
    return { notFound: true };
  }
  const trackId = findRes.rows[0].track_id;

  // 2. Verify access
  const access = await checkOwnership(parseInt(trackId, 10), user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  // 3. Delete
  await pool.query('DELETE FROM track_license_options WHERE license_option_id = $1', [parsedOptionId]);
  return { success: true };
};
