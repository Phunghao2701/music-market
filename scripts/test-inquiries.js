import logger from '../src/utils/logger.js';
import pool from '../src/config/database.js';

const BASE_URL = 'http://localhost:5000/api/v1';

const runTests = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Purchase Inquiries API Tests...');
    logger.info('===============================================');

    // Setup: Login Admin to create temporary tracks and options
    logger.info('\n[Setup] Logging in Admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@musicmarket.com', password: 'adminpassword' })
    });
    const loginData = await loginRes.json();
    const adminToken = loginData.data?.token;
    if (!adminToken) {
      logger.error('Failed to log in Admin. Aborting.');
      return;
    }
    logger.info('Admin logged in successfully.');

    // Setup: Create Track 1 (allow_inquiry = true)
    logger.info('\n[Setup] Creating Track 1 (allow_inquiry = true)...');
    const track1Res = await fetch(`${BASE_URL}/admin/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: `Inquiry Test Track 1 ${Date.now()}`,
        bpm: 100,
        musical_key: 'C Major',
        duration_seconds: 180,
        status: 'published',
        allow_inquiry: true
      })
    });
    const track1Data = await track1Res.json();
    const track1Id = track1Data.data?.track?.track_id;
    logger.info(`Track 1 created with ID: ${track1Id}`);

    // Setup: Create Track 2 (allow_inquiry = false)
    logger.info('\n[Setup] Creating Track 2 (allow_inquiry = false)...');
    const track2Res = await fetch(`${BASE_URL}/admin/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: `Inquiry Test Track 2 ${Date.now()}`,
        bpm: 90,
        musical_key: 'G Major',
        duration_seconds: 200,
        status: 'published',
        allow_inquiry: false
      })
    });
    const track2Data = await track2Res.json();
    const track2Id = track2Data.data?.track?.track_id;
    logger.info(`Track 2 created with ID: ${track2Id}`);

    // Setup: Fetch active license plans to get a plan ID
    const plansRes = await fetch(`${BASE_URL}/admin/license-plans`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const plansData = await plansRes.json();
    const planId = plansData.data?.license_plans?.[0]?.license_id;

    // Setup: Create a license option for Track 1
    logger.info('\n[Setup] Creating a license option for Track 1...');
    const optionRes = await fetch(`${BASE_URL}/admin/tracks/${track1Id}/license-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        license_plan_id: planId,
        price: 500000,
        is_available: true
      })
    });
    const optionData = await optionRes.json();
    const optionId = optionData.data?.license_option?.license_option_id;
    logger.info(`License option created with ID: ${optionId}`);

    // ==============================================================
    // [Test 1] POST /inquiries - Validation: Missing contact info
    // ==============================================================
    logger.info('\n[Test 1] POST inquiry without email and phone:');
    const t1Res = await fetch(`${BASE_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'John Doe',
        track_ids: [track1Id]
      })
    });
    const t1Data = await t1Res.json();
    logger.info(`Status: ${t1Res.status} (Expected: 400)`);
    logger.info(`Message: "${t1Data.message}"`);

    // ==============================================================
    // [Test 2] POST /inquiries - Validation: Invalid usage_purpose
    // ==============================================================
    logger.info('\n[Test 2] POST inquiry with invalid usage_purpose:');
    const t2Res = await fetch(`${BASE_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        track_ids: [track1Id],
        usage_purpose: 'invalid_purpose_enum'
      })
    });
    const t2Data = await t2Res.json();
    logger.info(`Status: ${t2Res.status} (Expected: 400)`);
    logger.info(`Message: "${t2Data.message}"`);

    // ==============================================================
    // [Test 3] POST /inquiries - Validation: Empty track_ids
    // ==============================================================
    logger.info('\n[Test 3] POST inquiry with empty track_ids:');
    const t3Res = await fetch(`${BASE_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        track_ids: []
      })
    });
    const t3Data = await t3Res.json();
    logger.info(`Status: ${t3Res.status} (Expected: 400)`);
    logger.info(`Message: "${t3Data.message}"`);

    // ==============================================================
    // [Test 4] POST /inquiries - Validation: Track not allowing inquiry
    // ==============================================================
    logger.info('\n[Test 4] POST inquiry for track with allow_inquiry = false:');
    const t4Res = await fetch(`${BASE_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        track_ids: [track2Id]
      })
    });
    const t4Data = await t4Res.json();
    logger.info(`Status: ${t4Res.status} (Expected: 400)`);
    logger.info(`Message: "${t4Data.message}"`);

    // ==============================================================
    // [Test 5] POST /inquiries - Successful single track inquiry
    // ==============================================================
    logger.info('\n[Test 5] POST successful single track inquiry:');
    const t5Res = await fetch(`${BASE_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test Customer',
        customer_email: 'testcustomer@example.com',
        customer_phone: '0987654321',
        company_name: 'Test Inc',
        track_ids: [track1Id],
        preferred_license_option_id: optionId,
        usage_purpose: 'commercial_release',
        usage_description: 'Album release',
        budget: 1200000,
        currency: 'VND',
        message: 'Hello, I want to buy this beat.'
      })
    });
    const t5Data = await t5Res.json();
    logger.info(`Status: ${t5Res.status} (Expected: 201)`);
    logger.info(`Inquiry ID: ${t5Data.data?.inquiry?.purchase_inquiry_id}`);
    logger.info(`Customer ID: ${t5Data.data?.inquiry?.customer_id}`);
    logger.info(`Status field: ${t5Data.data?.inquiry?.status} (Expected: new)`);

    const firstInquiryId = t5Data.data?.inquiry?.purchase_inquiry_id;
    const firstCustomerId = t5Data.data?.inquiry?.customer_id;

    // ==============================================================
    // [Test 6] GET /inquiries/:id/status - Verify status & details
    // ==============================================================
    logger.info('\n[Test 6] GET status of first inquiry:');
    const t6Res = await fetch(`${BASE_URL}/inquiries/${firstInquiryId}/status`);
    const t6Data = await t6Res.json();
    logger.info(`Status: ${t6Res.status} (Expected: 200)`);
    logger.info(`Customer Email: ${t6Data.data?.inquiry?.customer_email} (Expected: testcustomer@example.com)`);
    logger.info(`Tracks count: ${t6Data.data?.inquiry?.tracks?.length} (Expected: 1)`);
    logger.info(`Track 1 title: ${t6Data.data?.inquiry?.tracks?.[0]?.title}`);

    // ==============================================================
    // [Test 7] Customer Profile Reusability
    // ==============================================================
    logger.info('\n[Test 7] POST new inquiry using same email (profile reuse):');
    const t7Res = await fetch(`${BASE_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test Customer Updated Name',
        customer_email: 'testcustomer@example.com',
        track_ids: [track1Id],
        usage_purpose: 'youtube_tiktok'
      })
    });
    const t7Data = await t7Res.json();
    logger.info(`Status: ${t7Res.status} (Expected: 201)`);
    logger.info(`Customer ID in response: ${t7Data.data?.inquiry?.customer_id}`);
    logger.info(`Is Customer ID identical? ${t7Data.data?.inquiry?.customer_id === firstCustomerId ? 'YES' : 'NO'} (Expected: YES)`);

    // Verify track inquiry_count increment (Track 1 has 2 inquiries now)
    logger.info('\n[Verification] Verify track inquiry_count increment:');
    const verifyTrackRes = await pool.query('SELECT inquiry_count FROM tracks WHERE track_id = $1', [track1Id]);
    logger.info(`Track 1 inquiry_count: ${verifyTrackRes.rows[0]?.inquiry_count} (Expected: 2)`);

    // ==============================================================
    // [Cleanup] Deleting temporary tracks
    // ==============================================================
    logger.info('\n[Cleanup] Deleting temporary tracks...');
    const del1 = await fetch(`${BASE_URL}/admin/tracks/${track1Id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const del2 = await fetch(`${BASE_URL}/admin/tracks/${track2Id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logger.info(`Cleanup status: Track 1 (${del1.status}), Track 2 (${del2.status})`);

    logger.info('\n===============================================');
    logger.info('Purchase Inquiries API Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error running inquiries integration tests:', error);
  }
};

runTests().then(() => {
  // Exit the process so it doesn't hang in CI/CLI running
  process.exit(0);
});
