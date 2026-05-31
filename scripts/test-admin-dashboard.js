import logger from '../src/utils/logger.js';
import pool from '../src/config/database.js';

const BASE_URL = 'http://localhost:5000/api/v1';

const runTests = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Admin Dashboard API Tests...');
    logger.info('===============================================');

    // 1. Authenticate users
    logger.info('\n[Setup] Logging in users...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@musicmarket.com', password: 'adminpassword' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data?.token;

    const prodLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'producer@musicmarket.com', password: 'producerpassword' })
    });
    const prodLoginData = await prodLoginRes.json();
    const prodToken = prodLoginData.data?.token;

    // Create a temporary track
    logger.info('\n[Setup] Creating temporary track...');
    const trackRes = await fetch(`${BASE_URL}/admin/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: `Dashboard Test Track ${Date.now()}`,
        bpm: 128,
        musical_key: 'D Minor',
        duration_seconds: 210,
        status: 'published',
        allow_inquiry: true
      })
    });
    const trackData = await trackRes.json();
    const trackId = trackData.data?.track?.track_id;

    // Create a test customer
    const customerRes = await pool.query(
      `INSERT INTO customers (customer_name, customer_email, customer_phone) 
       VALUES ($1, $2, $3) RETURNING customer_id`,
      [`Dashboard Customer ${Date.now()}`, `dash_${Date.now()}@example.com`, '777777777']
    );
    const customerId = customerRes.rows[0].customer_id;

    // Create a completed purchase to ensure we have revenue data
    logger.info('[Setup] Creating completed purchase...');
    const purchaseRes = await fetch(`${BASE_URL}/admin/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        customer_id: customerId,
        track_id: trackId,
        license_name: 'Exclusive License',
        is_exclusive: true,
        final_price: 1250000,
        currency: 'VND',
        status: 'completed',
        note: 'dashboard test completed purchase'
      })
    });
    const purchaseData = await purchaseRes.json();
    const purchaseId = purchaseData.data?.purchase?.purchase_id;

    // ==============================================================
    // [Test 1] GET /admin/dashboard/summary - Forbidden Check (Producer)
    // ==============================================================
    logger.info('\n[Test 1] GET /admin/dashboard/summary as Producer (Forbidden):');
    const t1Res = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const t1Data = await t1Res.json();
    logger.info(`Status: ${t1Res.status} (Expected: 403)`);
    logger.info(`Message: "${t1Data.message}"`);

    // ==============================================================
    // [Test 2] GET /admin/dashboard/summary - Success Check (Admin)
    // ==============================================================
    logger.info('\n[Test 2] GET /admin/dashboard/summary as Admin:');
    const t2Res = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const t2Data = await t2Res.json();
    logger.info(`Status: ${t2Res.status} (Expected: 200)`);
    const summary = t2Data.data?.summary;
    logger.info(`Summary fields present:`);
    logger.info(` - total_tracks: ${summary?.total_tracks} (Type: ${typeof summary?.total_tracks})`);
    logger.info(` - published_tracks: ${summary?.published_tracks} (Type: ${typeof summary?.published_tracks})`);
    logger.info(` - new_inquiries: ${summary?.new_inquiries} (Type: ${typeof summary?.new_inquiries})`);
    logger.info(` - completed_purchases: ${summary?.completed_purchases} (Type: ${typeof summary?.completed_purchases})`);
    logger.info(` - total_revenue: ${summary?.total_revenue} (Type: ${typeof summary?.total_revenue})`);

    if (summary && typeof summary.total_tracks === 'number' && typeof summary.total_revenue === 'number') {
      logger.info('>> Summary Metrics Verification Passed.');
    } else {
      logger.info('>> Summary Metrics Verification Failed (wrong data types).');
    }

    // ==============================================================
    // [Test 3] GET /admin/dashboard/top-tracks - Default Sorting (play_count)
    // ==============================================================
    logger.info('\n[Test 3] GET /admin/dashboard/top-tracks as Admin (Default = play_count):');
    const t3Res = await fetch(`${BASE_URL}/admin/dashboard/top-tracks`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const t3Data = await t3Res.json();
    logger.info(`Status: ${t3Res.status} (Expected: 200)`);
    const topTracks = t3Data.data?.topTracks;
    logger.info(`Total top tracks retrieved: ${topTracks?.length}`);
    if (topTracks && topTracks.length > 0) {
      logger.info(`First track title: "${topTracks[0].title}", plays: ${topTracks[0].play_count}`);
      // verify sorting
      let sorted = true;
      for (let i = 0; i < topTracks.length - 1; i++) {
        if (topTracks[i].play_count < topTracks[i + 1].play_count) {
          sorted = false;
        }
      }
      logger.info(`Sorted by play_count? ${sorted} (Expected: true)`);
    }

    // ==============================================================
    // [Test 4] GET /admin/dashboard/top-tracks?sortBy=inquiry_count
    // ==============================================================
    logger.info('\n[Test 4] GET /admin/dashboard/top-tracks?sortBy=inquiry_count:');
    const t4Res = await fetch(`${BASE_URL}/admin/dashboard/top-tracks?sortBy=inquiry_count&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const t4Data = await t4Res.json();
    logger.info(`Status: ${t4Res.status} (Expected: 200)`);
    const topTracksInquiry = t4Data.data?.topTracks;
    logger.info(`Total top tracks retrieved (limit=5): ${topTracksInquiry?.length}`);
    if (topTracksInquiry && topTracksInquiry.length > 0) {
      logger.info(`First track title: "${topTracksInquiry[0].title}", inquiries: ${topTracksInquiry[0].inquiry_count}`);
      let sorted = true;
      for (let i = 0; i < topTracksInquiry.length - 1; i++) {
        if (topTracksInquiry[i].inquiry_count < topTracksInquiry[i + 1].inquiry_count) {
          sorted = false;
        }
      }
      logger.info(`Sorted by inquiry_count? ${sorted} (Expected: true)`);
    }

    // ==============================================================
    // [Test 5] GET /admin/dashboard/top-tracks?sortBy=invalid
    // ==============================================================
    logger.info('\n[Test 5] GET /admin/dashboard/top-tracks?sortBy=invalid_field:');
    const t5Res = await fetch(`${BASE_URL}/admin/dashboard/top-tracks?sortBy=invalid_field`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const t5Data = await t5Res.json();
    logger.info(`Status: ${t5Res.status} (Expected: 400)`);
    logger.info(`Message: "${t5Data.message}"`);

    // ==============================================================
    // [Test 6] GET /admin/dashboard/revenue
    // ==============================================================
    logger.info('\n[Test 6] GET /admin/dashboard/revenue:');
    const today = new Date().toISOString().split('T')[0];
    const t6Res = await fetch(`${BASE_URL}/admin/dashboard/revenue?startDate=${today}&endDate=${today}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const t6Data = await t6Res.json();
    logger.info(`Status: ${t6Res.status} (Expected: 200)`);
    const revenueSeries = t6Data.data?.revenue;
    logger.info(`Revenue days returned: ${revenueSeries?.length}`);
    if (revenueSeries && revenueSeries.length > 0) {
      logger.info(`Day: ${revenueSeries[0].date}, Revenue: ${revenueSeries[0].revenue} (Expected: 1250000)`);
      const dateMatch = /^\d{4}-\d{2}-\d{2}$/.test(revenueSeries[0].date);
      logger.info(`Is date format YYYY-MM-DD? ${dateMatch} (Expected: true)`);
    }

    // ==============================================================
    // [Test 7] GET /admin/dashboard/revenue - Invalid Date
    // ==============================================================
    logger.info('\n[Test 7] GET /admin/dashboard/revenue with invalid startDate:');
    const t7Res = await fetch(`${BASE_URL}/admin/dashboard/revenue?startDate=invalid-date`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const t7Data = await t7Res.json();
    logger.info(`Status: ${t7Res.status} (Expected: 400)`);
    logger.info(`Message: "${t7Data.message}"`);

    // ==============================================================
    // [Cleanup] Database Cleanup
    // ==============================================================
    logger.info('\n[Cleanup] Cleaning up dashboard test data...');
    await pool.query('DELETE FROM purchases WHERE purchase_id = $1', [purchaseId]);
    await pool.query('DELETE FROM customers WHERE customer_id = $1', [customerId]);
    await pool.query('DELETE FROM tracks WHERE track_id = $1', [trackId]);
    logger.info('Database cleanup complete.');

    logger.info('\n===============================================');
    logger.info('Admin Dashboard API Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error running admin dashboard integration tests:', error);
  }
};

runTests().then(() => {
  process.exit(0);
});
