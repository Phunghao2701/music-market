import pool from '../config/database.js';

const VALID_USAGE_PURPOSES = new Set([
  'personal_demo',
  'commercial_release',
  'youtube_tiktok',
  'advertising',
  'film_game',
  'live_performance',
  'brand_campaign',
  'other'
]);

/**
 * Submit a new purchase inquiry
 */
export const createInquiry = async (data) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    company_name,
    social_link,
    note,
    track_ids,
    preferred_license_option_id,
    usage_purpose,
    usage_description,
    budget,
    currency = 'VND',
    message
  } = data;

  // 1. Validation
  // Validate email/phone: at least one is required
  const emailVal = customer_email ? customer_email.trim() : null;
  const phoneVal = customer_phone ? customer_phone.trim() : null;
  if (!emailVal && !phoneVal) {
    return { invalidPayload: true, message: 'Yêu cầu cung cấp ít nhất email hoặc số điện thoại để liên hệ.' };
  }

  // Validate track_ids: must be non-empty array
  if (!track_ids || !Array.isArray(track_ids) || track_ids.length === 0) {
    return { invalidPayload: true, message: 'Yêu cầu cung cấp danh sách track_ids hợp lệ.' };
  }

  const parsedTrackIds = track_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  const uniqueTrackIds = [...new Set(parsedTrackIds)];

  if (uniqueTrackIds.length === 0) {
    return { invalidPayload: true, message: 'Danh sách track_ids không chứa ID hợp lệ.' };
  }

  // Validate usage_purpose enum if provided
  if (usage_purpose && !VALID_USAGE_PURPOSES.has(usage_purpose)) {
    return { invalidPayload: true, message: `Mục đích sử dụng (usage_purpose) không hợp lệ. Các giá trị được chấp nhận: ${[...VALID_USAGE_PURPOSES].join(', ')}` };
  }

  // Start a transaction using a client from the pool
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Validate all tracks exist and allow inquiries
    const tracksCheck = await client.query(
      'SELECT track_id, allow_inquiry FROM tracks WHERE track_id = ANY($1)',
      [uniqueTrackIds]
    );

    if (tracksCheck.rows.length !== uniqueTrackIds.length) {
      await client.query('ROLLBACK');
      return { invalidPayload: true, message: 'Một hoặc nhiều track_id không tồn tại trong hệ thống.' };
    }

    const blockedTrack = tracksCheck.rows.find(t => !t.allow_inquiry);
    if (blockedTrack) {
      await client.query('ROLLBACK');
      return { invalidPayload: true, message: `Bài nhạc với ID ${blockedTrack.track_id} không chấp nhận nhận yêu cầu mua.` };
    }

    // 3. Validate preferred_license_option_id if provided
    if (preferred_license_option_id) {
      const parsedOptionId = parseInt(preferred_license_option_id, 10);
      const optionCheck = await client.query(
        'SELECT license_option_id, track_id, is_available FROM track_license_options WHERE license_option_id = $1',
        [parsedOptionId]
      );
      if (optionCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return { invalidPayload: true, message: 'Cấu hình license option được lựa chọn không tồn tại.' };
      }
      const option = optionCheck.rows[0];
      if (!option.is_available) {
        await client.query('ROLLBACK');
        return { invalidPayload: true, message: 'Cấu hình license option được lựa chọn hiện tại không khả dụng.' };
      }
      // Ensure the license option belongs to one of the tracks in this inquiry
      const belongsToInquiryTracks = uniqueTrackIds.includes(parseInt(option.track_id, 10));
      if (!belongsToInquiryTracks) {
        await client.query('ROLLBACK');
        return { invalidPayload: true, message: 'Gói license option được chọn không thuộc bất cứ bài nhạc nào trong yêu cầu này.' };
      }
    }

    // 4. Match or create Customer profile
    let customerId;
    let customerRes;

    if (emailVal) {
      customerRes = await client.query(
        'SELECT customer_id FROM customers WHERE customer_email = $1',
        [emailVal]
      );
    }
    if ((!customerRes || customerRes.rows.length === 0) && phoneVal) {
      customerRes = await client.query(
        'SELECT customer_id FROM customers WHERE customer_phone = $1',
        [phoneVal]
      );
    }

    const nameVal = customer_name ? customer_name.trim() : 'Guest';
    const companyVal = company_name ? company_name.trim() : null;
    const socialVal = social_link ? social_link.trim() : null;
    const noteVal = note ? note.trim() : null;

    if (customerRes && customerRes.rows.length > 0) {
      // Reuse existing customer and update details
      customerId = parseInt(customerRes.rows[0].customer_id, 10);
      await client.query(
        `UPDATE customers
         SET customer_name = COALESCE($1, customer_name),
             company_name = COALESCE($2, company_name),
             social_link = COALESCE($3, social_link),
             note = COALESCE($4, note),
             updated_at = NOW()
         WHERE customer_id = $5`,
        [nameVal, companyVal, socialVal, noteVal, customerId]
      );
    } else {
      // Create new customer
      const insertCustomerRes = await client.query(
        `INSERT INTO customers (
           customer_name, customer_email, customer_phone, company_name, social_link, note
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING customer_id`,
        [nameVal, emailVal, phoneVal, companyVal, socialVal, noteVal]
      );
      customerId = parseInt(insertCustomerRes.rows[0].customer_id, 10);
    }

    // 5. Create Purchase Inquiry record
    const budgetVal = budget !== undefined && budget !== null ? parseFloat(budget) : null;
    const insertInquiryRes = await client.query(
      `INSERT INTO purchase_inquiries (
         customer_id, preferred_license_option_id, usage_purpose, usage_description, budget, currency, message, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING purchase_inquiry_id, customer_id, preferred_license_option_id, usage_purpose, usage_description, budget, currency, message, status, created_at`,
      [
        customerId,
        preferred_license_option_id ? parseInt(preferred_license_option_id, 10) : null,
        usage_purpose || null,
        usage_description || null,
        budgetVal,
        currency.trim(),
        message || null,
        'new'
      ]
    );
    const inquiry = insertInquiryRes.rows[0];
    const inquiryId = parseInt(inquiry.purchase_inquiry_id, 10);

    // 6. Map to tracks (inquiry_tracks) & Increment track counters
    for (const trackId of uniqueTrackIds) {
      await client.query(
        'INSERT INTO inquiry_tracks (inquiry_id, track_id) VALUES ($1, $2)',
        [inquiryId, trackId]
      );
      await client.query(
        'UPDATE tracks SET inquiry_count = inquiry_count + 1 WHERE track_id = $1',
        [trackId]
      );
    }

    await client.query('COMMIT');

    // Return the summary object
    return {
      success: true,
      inquiry: {
        ...inquiry,
        track_ids: uniqueTrackIds
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get the current status and summary of a purchase inquiry
 */
export const getInquiryStatus = async (purchaseInquiryId) => {
  const parsedInquiryId = parseInt(purchaseInquiryId, 10);
  if (isNaN(parsedInquiryId)) {
    return { notFound: true };
  }

  // 1. Fetch inquiry details joined with customer
  const inquiryRes = await pool.query(
    `SELECT 
       i.purchase_inquiry_id,
       i.customer_id,
       i.preferred_license_option_id,
       i.usage_purpose,
       i.usage_description,
       i.budget,
       i.currency,
       i.message,
       i.status,
       i.created_at,
       i.updated_at,
       c.customer_name,
       c.customer_email,
       c.customer_phone,
       c.company_name
     FROM purchase_inquiries i
     JOIN customers c ON i.customer_id = c.customer_id
     WHERE i.purchase_inquiry_id = $1`,
    [parsedInquiryId]
  );

  if (inquiryRes.rows.length === 0) {
    return { notFound: true };
  }

  const inquiry = inquiryRes.rows[0];

  // 2. Fetch associated tracks
  const tracksRes = await pool.query(
    `SELECT t.track_id, t.title, t.slug, t.cover_image_url
     FROM inquiry_tracks it
     JOIN tracks t ON it.track_id = t.track_id
     WHERE it.inquiry_id = $1`,
    [parsedInquiryId]
  );

  return {
    success: true,
    inquiry: {
      ...inquiry,
      tracks: tracksRes.rows
    }
  };
};

const VALID_INQUIRY_STATUSES = new Set([
  'new',
  'contacted',
  'negotiating',
  'waiting_payment',
  'paid',
  'delivered',
  'closed',
  'rejected'
]);

/**
 * Admin: List purchase inquiries with filtering and search capabilities
 */
export const listInquiriesAdmin = async (filters = {}) => {
  const { status, search } = filters;
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status.trim());
    conditions.push(`i.status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search.trim()}%`);
    conditions.push(`(c.customer_name ILIKE $${params.length} OR c.customer_email ILIKE $${params.length} OR c.customer_phone ILIKE $${params.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      i.purchase_inquiry_id,
      i.customer_id,
      i.preferred_license_option_id,
      i.usage_purpose,
      i.usage_description,
      i.budget,
      i.currency,
      i.message,
      i.status,
      i.admin_note,
      i.created_at,
      i.updated_at,
      c.customer_name,
      c.customer_email,
      c.customer_phone,
      c.company_name,
      COALESCE(
        json_agg(
          json_build_object(
            'track_id', t.track_id,
            'title', t.title,
            'slug', t.slug,
            'cover_image_url', t.cover_image_url
          )
        ) FILTER (WHERE t.track_id IS NOT NULL),
        '[]'
      ) AS tracks
    FROM purchase_inquiries i
    JOIN customers c ON i.customer_id = c.customer_id
    LEFT JOIN inquiry_tracks it ON i.purchase_inquiry_id = it.inquiry_id
    LEFT JOIN tracks t ON it.track_id = t.track_id
    ${whereClause}
    GROUP BY i.purchase_inquiry_id, c.customer_id
    ORDER BY i.created_at DESC
  `;

  const result = await pool.query(sql, params);
  return result.rows;
};

/**
 * Admin: Get detailed inquiry info (including admin_note)
 */
export const getInquiryDetailAdmin = async (purchaseInquiryId) => {
  const parsedInquiryId = parseInt(purchaseInquiryId, 10);
  if (isNaN(parsedInquiryId)) {
    return { notFound: true };
  }

  const inquiryRes = await pool.query(
    `SELECT 
       i.purchase_inquiry_id,
       i.customer_id,
       i.preferred_license_option_id,
       i.usage_purpose,
       i.usage_description,
       i.budget,
       i.currency,
       i.message,
       i.status,
       i.admin_note,
       i.created_at,
       i.updated_at,
       c.customer_name,
       c.customer_email,
       c.customer_phone,
       c.company_name,
       c.social_link,
       c.note AS customer_note
     FROM purchase_inquiries i
     JOIN customers c ON i.customer_id = c.customer_id
     WHERE i.purchase_inquiry_id = $1`,
    [parsedInquiryId]
  );

  if (inquiryRes.rows.length === 0) {
    return { notFound: true };
  }

  const inquiry = inquiryRes.rows[0];

  const tracksRes = await pool.query(
    `SELECT t.track_id, t.title, t.slug, t.cover_image_url, t.status AS track_status, t.allow_inquiry
     FROM inquiry_tracks it
     JOIN tracks t ON it.track_id = t.track_id
     WHERE it.inquiry_id = $1`,
    [parsedInquiryId]
  );

  return {
    success: true,
    inquiry: {
      ...inquiry,
      tracks: tracksRes.rows
    }
  };
};

/**
 * Admin: Update status of a purchase inquiry
 */
export const updateInquiryStatus = async (purchaseInquiryId, status) => {
  const parsedInquiryId = parseInt(purchaseInquiryId, 10);
  if (isNaN(parsedInquiryId)) {
    return { notFound: true };
  }

  if (!status || !VALID_INQUIRY_STATUSES.has(status)) {
    return { invalidStatus: true, message: `Trạng thái không hợp lệ. Các giá trị được chấp nhận: ${[...VALID_INQUIRY_STATUSES].join(', ')}` };
  }

  const result = await pool.query(
    `UPDATE purchase_inquiries
     SET status = $1, updated_at = NOW()
     WHERE purchase_inquiry_id = $2
     RETURNING *`,
    [status, parsedInquiryId]
  );

  if (result.rows.length === 0) {
    return { notFound: true };
  }

  return {
    success: true,
    inquiry: result.rows[0]
  };
};

/**
 * Admin: Update admin note on a purchase inquiry
 */
export const updateInquiryNote = async (purchaseInquiryId, adminNote) => {
  const parsedInquiryId = parseInt(purchaseInquiryId, 10);
  if (isNaN(parsedInquiryId)) {
    return { notFound: true };
  }

  const noteVal = adminNote !== undefined && adminNote !== null ? adminNote.trim() : null;

  const result = await pool.query(
    `UPDATE purchase_inquiries
     SET admin_note = $1, updated_at = NOW()
     WHERE purchase_inquiry_id = $2
     RETURNING *`,
    [noteVal, parsedInquiryId]
  );

  if (result.rows.length === 0) {
    return { notFound: true };
  }

  return {
    success: true,
    inquiry: result.rows[0]
  };
};
