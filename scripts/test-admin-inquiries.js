import logger from '../src/utils/logger.js';
import pool from '../src/config/database.js';

const BASE_URL = 'http://localhost:5000/api/v1';

const runTests = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Admin Purchase Inquiries API Tests...');
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

    logger.info(`Admin Token: ${!!adminToken}`);
    logger.info(`Producer Token: ${!!prodToken}`);

    // Create a temporary track to submit inquiries against
    logger.info('\n[Setup] Creating temporary track...');
    const trackRes = await fetch(`${BASE_URL}/admin/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: `Admin Inquiry Test Track ${Date.now()}`,
        bpm: 120,
        musical_key: 'E Minor',
        duration_seconds: 150,
        status: 'published',
        allow_inquiry: true
      })
    });
    const trackData = await trackRes.json();
    const trackId = trackData.data?.track?.track_id;
    logger.info(`Created temporary Track ID: ${trackId}`);

    // Submit two public inquiries
    logger.info('\n[Setup] Submitting 2 temporary inquiries...');
    const inq1Res = await fetch(`${BASE_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Alpha Customer',
        customer_email: 'alpha@example.com',
        customer_phone: '111111111',
        track_ids: [trackId],
        usage_purpose: 'personal_demo',
        message: 'alpha inquiry request message'
      })
    });
    const inq1Data = await inq1Res.json();
    const inquiry1Id = inq1Data.data?.inquiry?.purchase_inquiry_id;

    const inq2Res = await fetch(`${BASE_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Beta User',
        customer_email: 'beta@example.com',
        customer_phone: '222222222',
        track_ids: [trackId],
        usage_purpose: 'youtube_tiktok',
        message: 'beta inquiry request message'
      })
    });
    const inq2Data = await inq2Res.json();
    const inquiry2Id = inq2Data.data?.inquiry?.purchase_inquiry_id;

    logger.info(`Inquiry 1 ID: ${inquiry1Id}, Inquiry 2 ID: ${inquiry2Id}`);

    // ==============================================================
    // [Test 1] GET /admin/inquiries - Forbidden Check (Producer)
    // ==============================================================
    logger.info('\n[Test 1] GET /admin/inquiries as Producer (Forbidden):');
    const t1Res = await fetch(`${BASE_URL}/admin/inquiries`, {
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const t1Data = await t1Res.json();
    logger.info(`Status: ${t1Res.status} (Expected: 403)`);
    logger.info(`Message: "${t1Data.message}"`);

    // ==============================================================
    // [Test 2] GET /admin/inquiries - List all (Admin)
    // ==============================================================
    logger.info('\n[Test 2] GET /admin/inquiries as Admin (List all):');
    const t2Res = await fetch(`${BASE_URL}/admin/inquiries`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const t2Data = await t2Res.json();
    logger.info(`Status: ${t2Res.status} (Expected: 200)`);
    logger.info(`Total inquiries: ${t2Data.data?.inquiries?.length}`);
    logger.info(`First inquiry customer name: ${t2Data.data?.inquiries?.[0]?.customer_name}`);
    logger.info(`First inquiry tracks count: ${t2Data.data?.inquiries?.[0]?.tracks?.length}`);

    // ==============================================================
    // [Test 3] GET /admin/inquiries - Filter by status
    // ==============================================================
    logger.info('\n[Test 3] GET /admin/inquiries?status=new as Admin:');
    const t3Res = await fetch(`${BASE_URL}/admin/inquiries?status=new`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const t3Data = await t3Res.json();
    logger.info(`Status: ${t3Res.status} (Expected: 200)`);
    const allAreNew = t3Data.data?.inquiries?.every(i => i.status === 'new');
    logger.info(`Are all returned status 'new'? ${allAreNew ? 'YES' : 'NO'}`);

    // ==============================================================
    // [Test 4] GET /admin/inquiries - Search by customer name
    // ==============================================================
    logger.info('\n[Test 4] GET /admin/inquiries?search=Alpha as Admin:');
    const t4Res = await fetch(`${BASE_URL}/admin/inquiries?search=Alpha`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const t4Data = await t4Res.json();
    logger.info(`Status: ${t4Res.status} (Expected: 200)`);
    logger.info(`Inquiries count: ${t4Data.data?.inquiries?.length} (Expected: 1)`);
    logger.info(`Inquiry customer name: ${t4Data.data?.inquiries?.[0]?.customer_name} (Expected: Alpha Customer)`);

    // ==============================================================
    // [Test 5] GET /admin/inquiries/:id - Detail view
    // ==============================================================
    logger.info('\n[Test 5] GET /admin/inquiries/:id for Inquiry 1:');
    const t5Res = await fetch(`${BASE_URL}/admin/inquiries/${inquiry1Id}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const t5Data = await t5Res.json();
    logger.info(`Status: ${t5Res.status} (Expected: 200)`);
    logger.info(`Customer name: ${t5Data.data?.inquiry?.customer_name} (Expected: Alpha Customer)`);
    logger.info(`Message: "${t5Data.data?.inquiry?.message}"`);

    // ==============================================================
    // [Test 6] PATCH /admin/inquiries/:id/status - Update Status
    // ==============================================================
    logger.info('\n[Test 6] PATCH update status to "contacted":');
    const t6Res = await fetch(`${BASE_URL}/admin/inquiries/${inquiry1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'contacted' })
    });
    const t6Data = await t6Res.json();
    logger.info(`Status: ${t6Res.status} (Expected: 200)`);
    logger.info(`Updated status in response: ${t6Data.data?.inquiry?.status} (Expected: contacted)`);

    // Try invalid status
    logger.info('\n[Test 6b] PATCH update status to invalid value:');
    const t6bRes = await fetch(`${BASE_URL}/admin/inquiries/${inquiry1Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'invalid_status_value' })
    });
    const t6bData = await t6bRes.json();
    logger.info(`Status: ${t6bRes.status} (Expected: 400)`);
    logger.info(`Response message: "${t6bData.message}"`);

    // ==============================================================
    // [Test 7] PATCH /admin/inquiries/:id/note - Update Admin Note
    // ==============================================================
    logger.info('\n[Test 7] PATCH update admin note:');
    const t7Res = await fetch(`${BASE_URL}/admin/inquiries/${inquiry1Id}/note`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ admin_note: 'Called them on phone. They requested a discount.' })
    });
    const t7Data = await t7Res.json();
    logger.info(`Status: ${t7Res.status} (Expected: 200)`);
    logger.info(`Updated admin_note: "${t7Data.data?.inquiry?.admin_note}"`);

    // Verification: GET detail should now return the updated status and admin_note
    logger.info('\n[Verification] GET detailed inquiry again to verify updates:');
    const verifyRes = await fetch(`${BASE_URL}/admin/inquiries/${inquiry1Id}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const verifyData = await verifyRes.json();
    logger.info(`Status in DB: ${verifyData.data?.inquiry?.status} (Expected: contacted)`);
    logger.info(`Note in DB: "${verifyData.data?.inquiry?.admin_note}"`);

    // ==============================================================
    // [Cleanup] Delete temporary track & inquiries
    // ==============================================================
    logger.info('\n[Cleanup] Deleting temporary track...');
    const delRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logger.info(`Track Cleanup Status: ${delRes.status} (Expected: 200)`);

    logger.info('\n===============================================');
    logger.info('Admin Purchase Inquiries API Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error running admin inquiries integration tests:', error);
  }
};

runTests().then(() => {
  process.exit(0);
});
