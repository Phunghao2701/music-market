import pool from '../config/database.js';

const VALID_PURCHASE_STATUSES = new Set([
  'pending',
  'paid',
  'delivered',
  'completed',
  'cancelled',
  'refunded'
]);

/**
 * Admin: List all purchases with customer and track information
 */
export const listPurchasesAdmin = async () => {
  const sql = `
    SELECT 
      p.purchase_id,
      p.inquiry_id,
      p.customer_id,
      p.track_id,
      p.license_option_id,
      p.license_name,
      p.is_exclusive,
      p.final_price,
      p.currency,
      p.status,
      p.contract_url,
      p.delivered_file_url,
      p.paid_at,
      p.delivered_at,
      p.completed_at,
      p.note,
      p.created_at,
      p.updated_at,
      c.customer_name,
      c.customer_email,
      c.customer_phone,
      t.title AS track_title,
      t.slug AS track_slug
    FROM purchases p
    JOIN customers c ON p.customer_id = c.customer_id
    JOIN tracks t ON p.track_id = t.track_id
    ORDER BY p.created_at DESC
  `;
  const result = await pool.query(sql);
  return result.rows;
};

/**
 * Admin: Get detailed purchase information
 */
export const getPurchaseDetailAdmin = async (purchaseId) => {
  const parsedId = parseInt(purchaseId, 10);
  if (isNaN(parsedId)) {
    return { notFound: true };
  }

  const sql = `
    SELECT 
      p.purchase_id,
      p.inquiry_id,
      p.customer_id,
      p.track_id,
      p.license_option_id,
      p.license_name,
      p.is_exclusive,
      p.final_price,
      p.currency,
      p.status,
      p.contract_url,
      p.delivered_file_url,
      p.paid_at,
      p.delivered_at,
      p.completed_at,
      p.note,
      p.created_at,
      p.updated_at,
      c.customer_name,
      c.customer_email,
      c.customer_phone,
      c.company_name,
      t.title AS track_title,
      t.slug AS track_slug,
      t.cover_image_url AS track_cover_image_url
    FROM purchases p
    JOIN customers c ON p.customer_id = c.customer_id
    JOIN tracks t ON p.track_id = t.track_id
    WHERE p.purchase_id = $1
  `;
  
  const result = await pool.query(sql, [parsedId]);
  if (result.rows.length === 0) {
    return { notFound: true };
  }

  return {
    success: true,
    purchase: result.rows[0]
  };
};

/**
 * Admin: Create a purchase (from inquiry or manually)
 */
export const createPurchaseAdmin = async (payload) => {
  const {
    inquiry_id,
    customer_id,
    track_id,
    license_option_id,
    license_name,
    is_exclusive,
    final_price,
    currency = 'VND',
    status = 'pending',
    note,
    contract_url,
    delivered_file_url
  } = payload;

  const parsedTrackId = parseInt(track_id, 10);
  if (isNaN(parsedTrackId)) {
    return { invalidPayload: true, message: 'Yêu cầu cung cấp track_id hợp lệ.' };
  }

  // 1. Verify Track Exists
  const trackCheck = await pool.query('SELECT track_id FROM tracks WHERE track_id = $1', [parsedTrackId]);
  if (trackCheck.rows.length === 0) {
    return { invalidPayload: true, message: 'Bài nhạc không tồn tại.' };
  }

  // 2. Resolve Customer ID
  let resolvedCustomerId = customer_id ? parseInt(customer_id, 10) : null;
  if (inquiry_id) {
    const inquiryCheck = await pool.query(
      'SELECT customer_id FROM purchase_inquiries WHERE purchase_inquiry_id = $1',
      [parseInt(inquiry_id, 10)]
    );
    if (inquiryCheck.rows.length === 0) {
      return { invalidPayload: true, message: 'Yêu cầu mua nhạc (inquiry) không tồn tại.' };
    }
    resolvedCustomerId = inquiryCheck.rows[0].customer_id;
  }

  if (!resolvedCustomerId || isNaN(resolvedCustomerId)) {
    return { invalidPayload: true, message: 'Yêu cầu cung cấp thông tin khách hàng (customer_id).' };
  }

  const customerCheck = await pool.query('SELECT customer_id FROM customers WHERE customer_id = $1', [resolvedCustomerId]);
  if (customerCheck.rows.length === 0) {
    return { invalidPayload: true, message: 'Khách hàng không tồn tại.' };
  }

  // 3. Resolve License Option Details if provided
  let resolvedLicenseName = license_name;
  let resolvedIsExclusive = is_exclusive === true || is_exclusive === 'true';
  let resolvedFinalPrice = final_price;

  if (license_option_id) {
    const parsedOptionId = parseInt(license_option_id, 10);
    const optionCheck = await pool.query(
      `SELECT tlo.price, lp.license_name, lp.is_exclusive
       FROM track_license_options tlo
       JOIN license_plans lp ON tlo.license_plan_id = lp.license_id
       WHERE tlo.license_option_id = $1 AND tlo.track_id = $2`,
      [parsedOptionId, parsedTrackId]
    );

    if (optionCheck.rows.length === 0) {
      return { invalidPayload: true, message: 'Tùy chọn bản quyền không hợp lệ cho bài nhạc này.' };
    }

    const dbOption = optionCheck.rows[0];
    if (resolvedLicenseName === undefined || resolvedLicenseName === null) {
      resolvedLicenseName = dbOption.license_name;
    }
    if (is_exclusive === undefined || is_exclusive === null) {
      resolvedIsExclusive = dbOption.is_exclusive;
    }
    if (resolvedFinalPrice === undefined || resolvedFinalPrice === null) {
      resolvedFinalPrice = dbOption.price;
    }
  }

  if (!resolvedLicenseName) {
    return { invalidPayload: true, message: 'Yêu cầu cung cấp tên bản quyền (license_name).' };
  }

  if (resolvedFinalPrice === undefined || resolvedFinalPrice === null || isNaN(parseFloat(resolvedFinalPrice))) {
    return { invalidPayload: true, message: 'Yêu cầu cung cấp giá bán hợp lệ (final_price).' };
  }

  if (!VALID_PURCHASE_STATUSES.has(status)) {
    return { invalidPayload: true, message: `Trạng thái không hợp lệ. Các giá trị chấp nhận: ${[...VALID_PURCHASE_STATUSES].join(', ')}` };
  }

  // 4. Check Exclusive Constraint
  if (resolvedIsExclusive && ['paid', 'delivered', 'completed'].includes(status)) {
    const dupCheck = await pool.query(
      `SELECT COUNT(*) FROM purchases 
       WHERE track_id = $1 AND is_exclusive = TRUE AND status IN ('paid', 'delivered', 'completed')`,
      [parsedTrackId]
    );
    if (parseInt(dupCheck.rows[0].count, 10) > 0) {
      return { invalidPayload: true, message: 'Bài nhạc này đã có giao dịch độc quyền thành công.' };
    }
  }

  // 5. Build Timestamps based on status
  let paid_at = null;
  let delivered_at = null;
  let completed_at = null;

  if (status === 'paid') {
    paid_at = new Date();
  } else if (status === 'delivered') {
    paid_at = new Date();
    delivered_at = new Date();
  } else if (status === 'completed') {
    paid_at = new Date();
    delivered_at = new Date();
    completed_at = new Date();
  }

  // 6. Execute Insert
  const insertSql = `
    INSERT INTO purchases (
      inquiry_id,
      customer_id,
      track_id,
      license_option_id,
      license_name,
      is_exclusive,
      final_price,
      currency,
      status,
      contract_url,
      delivered_file_url,
      paid_at,
      delivered_at,
      completed_at,
      note
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;
  const insertParams = [
    inquiry_id ? parseInt(inquiry_id, 10) : null,
    resolvedCustomerId,
    parsedTrackId,
    license_option_id ? parseInt(license_option_id, 10) : null,
    resolvedLicenseName,
    resolvedIsExclusive,
    resolvedFinalPrice,
    currency,
    status,
    contract_url || null,
    delivered_file_url || null,
    paid_at,
    delivered_at,
    completed_at,
    note || null
  ];

  const result = await pool.query(insertSql, insertParams);
  return {
    success: true,
    purchase: result.rows[0]
  };
};

/**
 * Admin: Update purchase status and relevant timestamps
 */
export const updatePurchaseStatus = async (purchaseId, status) => {
  const parsedId = parseInt(purchaseId, 10);
  if (isNaN(parsedId)) {
    return { notFound: true };
  }

  if (!status || !VALID_PURCHASE_STATUSES.has(status)) {
    return { invalidPayload: true, message: `Trạng thái không hợp lệ. Các giá trị chấp nhận: ${[...VALID_PURCHASE_STATUSES].join(', ')}` };
  }

  // Get current purchase details
  const currentRes = await pool.query(
    'SELECT track_id, is_exclusive, paid_at, delivered_at, completed_at FROM purchases WHERE purchase_id = $1',
    [parsedId]
  );
  if (currentRes.rows.length === 0) {
    return { notFound: true };
  }

  const purchase = currentRes.rows[0];

  // Enforce exclusivity rule
  if (purchase.is_exclusive && ['paid', 'delivered', 'completed'].includes(status)) {
    const dupCheck = await pool.query(
      `SELECT COUNT(*) FROM purchases 
       WHERE track_id = $1 AND is_exclusive = TRUE AND status IN ('paid', 'delivered', 'completed') AND purchase_id != $2`,
      [purchase.track_id, parsedId]
    );
    if (parseInt(dupCheck.rows[0].count, 10) > 0) {
      return { invalidPayload: true, message: 'Bài nhạc này đã có giao dịch độc quyền thành công.' };
    }
  }

  // Timestamps calculation
  let paid_at = purchase.paid_at;
  let delivered_at = purchase.delivered_at;
  let completed_at = purchase.completed_at;

  const now = new Date();
  if (status === 'paid') {
    if (!paid_at) paid_at = now;
  } else if (status === 'delivered') {
    if (!paid_at) paid_at = now;
    if (!delivered_at) delivered_at = now;
  } else if (status === 'completed') {
    if (!paid_at) paid_at = now;
    if (!delivered_at) delivered_at = now;
    if (!completed_at) completed_at = now;
  }

  const updateSql = `
    UPDATE purchases 
    SET status = $1, paid_at = $2, delivered_at = $3, completed_at = $4, updated_at = NOW()
    WHERE purchase_id = $5
    RETURNING *
  `;
  const result = await pool.query(updateSql, [status, paid_at, delivered_at, completed_at, parsedId]);
  return {
    success: true,
    purchase: result.rows[0]
  };
};

/**
 * Admin: Update purchase delivery fields (delivered_file_url, contract_url)
 */
export const updatePurchaseDelivery = async (purchaseId, deliveryData) => {
  const parsedId = parseInt(purchaseId, 10);
  if (isNaN(parsedId)) {
    return { notFound: true };
  }

  const { contract_url, delivered_file_url } = deliveryData;

  const currentRes = await pool.query(
    'SELECT contract_url, delivered_file_url FROM purchases WHERE purchase_id = $1',
    [parsedId]
  );
  if (currentRes.rows.length === 0) {
    return { notFound: true };
  }

  const purchase = currentRes.rows[0];
  const newContractUrl = contract_url !== undefined ? contract_url : purchase.contract_url;
  const newDeliveredFileUrl = delivered_file_url !== undefined ? delivered_file_url : purchase.delivered_file_url;

  const updateSql = `
    UPDATE purchases 
    SET contract_url = $1, delivered_file_url = $2, updated_at = NOW()
    WHERE purchase_id = $3
    RETURNING *
  `;
  const result = await pool.query(updateSql, [newContractUrl, newDeliveredFileUrl, parsedId]);
  return {
    success: true,
    purchase: result.rows[0]
  };
};
