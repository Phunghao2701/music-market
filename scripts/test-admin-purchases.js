import logger from '../src/utils/logger.js';
import pool from '../src/config/database.js';

const BASE_URL = 'http://localhost:5000/api/v1';

const runTests = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Admin Purchases API Tests...');
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
        title: `Admin Purchase Test Track ${Date.now()}`,
        bpm: 125,
        musical_key: 'A Minor',
        duration_seconds: 160,
        status: 'published',
        allow_inquiry: true
      })
    });
    const trackData = await trackRes.json();
    const trackId = trackData.data?.track?.track_id;

    // Create a test customer in DB
    logger.info('\n[Setup] Seeding test customer...');
    const customerRes = await pool.query(
      `INSERT INTO customers (customer_name, customer_email, customer_phone) 
       VALUES ($1, $2, $3) RETURNING customer_id`,
      [`Purch Customer ${Date.now()}`, `purch_${Date.now()}@example.com`, '999999999']
    );
    const customerId = customerRes.rows[0].customer_id;

    logger.info(`Track ID: ${trackId}, Customer ID: ${customerId}`);

    // ==============================================================
    // [Test 1] GET /admin/purchases - Forbidden Check (Producer)
    // ==============================================================
    logger.info('\n[Test 1] GET /admin/purchases as Producer (Forbidden):');
    const t1Res = await fetch(`${BASE_URL}/admin/purchases`, {
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const t1Data = await t1Res.json();
    logger.info(`Status: ${t1Res.status} (Expected: 403)`);
    logger.info(`Message: "${t1Data.message}"`);

    // ==============================================================
    // [Test 2] POST /admin/purchases - Manual Creation (Non-Exclusive)
    // ==============================================================
    logger.info('\n[Test 2] POST manually create a non-exclusive pending purchase:');
    const t2Res = await fetch(`${BASE_URL}/admin/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        customer_id: customerId,
        track_id: trackId,
        license_name: 'Non-Exclusive License',
        is_exclusive: false,
        final_price: 300000,
        currency: 'VND',
        status: 'pending',
        note: 'non-exclusive pending purchase note'
      })
    });
    const t2Data = await t2Res.json();
    logger.info(`Status: ${t2Res.status} (Expected: 201)`);
    const purchaseId1 = t2Data.data?.purchase?.purchase_id;
    logger.info(`Purchase 1 ID: ${purchaseId1}`);
    logger.info(`Is Exclusive? ${t2Data.data?.purchase?.is_exclusive} (Expected: false)`);
    logger.info(`Status: ${t2Data.data?.purchase?.status} (Expected: pending)`);

    // ==============================================================
    // [Test 3] POST /admin/purchases - Exclusive Creation (First)
    // ==============================================================
    logger.info('\n[Test 3] POST manually create an exclusive completed purchase:');
    const t3Res = await fetch(`${BASE_URL}/admin/purchases`, {
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
        final_price: 2000000,
        currency: 'VND',
        status: 'completed',
        note: 'first exclusive completed'
      })
    });
    const t3Data = await t3Res.json();
    logger.info(`Status: ${t3Res.status} (Expected: 201)`);
    const purchaseId2 = t3Data.data?.purchase?.purchase_id;
    logger.info(`Purchase 2 ID: ${purchaseId2}`);
    logger.info(`Is Exclusive? ${t3Data.data?.purchase?.is_exclusive} (Expected: true)`);
    logger.info(`Status: ${t3Data.data?.purchase?.status} (Expected: completed)`);
    logger.info(`paid_at: ${!!t3Data.data?.purchase?.paid_at}, completed_at: ${!!t3Data.data?.purchase?.completed_at}`);

    // ==============================================================
    // [Test 4] POST /admin/purchases - Exclusive Collision Rule
    // ==============================================================
    logger.info('\n[Test 4] POST create a second exclusive paid purchase for same track (Collision):');
    const t4Res = await fetch(`${BASE_URL}/admin/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        customer_id: customerId,
        track_id: trackId,
        license_name: 'Exclusive License 2',
        is_exclusive: true,
        final_price: 2500000,
        currency: 'VND',
        status: 'paid',
        note: 'second exclusive paid'
      })
    });
    const t4Data = await t4Res.json();
    logger.info(`Status: ${t4Res.status} (Expected: 400)`);
    logger.info(`Message: "${t4Data.message}" (Expected: "Bài nhạc này đã có giao dịch độc quyền thành công.")`);

    // ==============================================================
    // [Test 5] GET /admin/purchases - List All
    // ==============================================================
    logger.info('\n[Test 5] GET /admin/purchases as Admin:');
    const t5Res = await fetch(`${BASE_URL}/admin/purchases`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const t5Data = await t5Res.json();
    logger.info(`Status: ${t5Res.status} (Expected: 200)`);
    logger.info(`Total purchases found: ${t5Data.data?.purchases?.length}`);
    const found1 = t5Data.data?.purchases?.find(p => p.purchase_id === purchaseId1);
    const found2 = t5Data.data?.purchases?.find(p => p.purchase_id === purchaseId2);
    logger.info(`Purchase 1 in list? ${!!found1}`);
    logger.info(`Purchase 2 in list? ${!!found2}`);

    // ==============================================================
    // [Test 6] GET /admin/purchases/:id - Detail
    // ==============================================================
    logger.info('\n[Test 6] GET /admin/purchases/:id:');
    const t6Res = await fetch(`${BASE_URL}/admin/purchases/${purchaseId1}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const t6Data = await t6Res.json();
    logger.info(`Status: ${t6Res.status} (Expected: 200)`);
    logger.info(`Customer Name: ${t6Data.data?.purchase?.customer_name}`);
    logger.info(`Track Title: ${t6Data.data?.purchase?.track_title}`);

    // ==============================================================
    // [Test 7] PATCH /admin/purchases/:id/status - Timestamp Progression
    // ==============================================================
    logger.info('\n[Test 7] PATCH status transition from pending to paid:');
    const t7Res = await fetch(`${BASE_URL}/admin/purchases/${purchaseId1}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'paid' })
    });
    const t7Data = await t7Res.json();
    logger.info(`Status: ${t7Res.status} (Expected: 200)`);
    logger.info(`Updated status: ${t7Data.data?.purchase?.status} (Expected: paid)`);
    logger.info(`paid_at set? ${!!t7Data.data?.purchase?.paid_at}`);
    logger.info(`delivered_at set? ${!!t7Data.data?.purchase?.delivered_at} (Expected: false)`);

    logger.info('\n[Test 7b] PATCH status transition from paid to completed:');
    const t7bRes = await fetch(`${BASE_URL}/admin/purchases/${purchaseId1}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'completed' })
    });
    const t7bData = await t7bRes.json();
    logger.info(`Status: ${t7bRes.status} (Expected: 200)`);
    logger.info(`Updated status: ${t7bData.data?.purchase?.status} (Expected: completed)`);
    logger.info(`delivered_at set? ${!!t7bData.data?.purchase?.delivered_at} (Expected: true)`);
    logger.info(`completed_at set? ${!!t7bData.data?.purchase?.completed_at} (Expected: true)`);

    // ==============================================================
    // [Test 8] PATCH /admin/purchases/:id/delivery - Update delivery info
    // ==============================================================
    logger.info('\n[Test 8] PATCH update contract and delivery URL:');
    const t8Res = await fetch(`${BASE_URL}/admin/purchases/${purchaseId1}/delivery`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        contract_url: 'https://example.com/contract1.pdf',
        delivered_file_url: 'https://example.com/beat1.wav'
      })
    });
    const t8Data = await t8Res.json();
    logger.info(`Status: ${t8Res.status} (Expected: 200)`);
    logger.info(`contract_url: "${t8Data.data?.purchase?.contract_url}"`);
    logger.info(`delivered_file_url: "${t8Data.data?.purchase?.delivered_file_url}"`);

    // ==============================================================
    // [Cleanup] Deleting temporary track
    // ==============================================================
    logger.info('\n[Cleanup] Deleting temporary track...');
    const delRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logger.info(`Track Cleanup Status: ${delRes.status} (Expected: 200)`);

    // Clean up seeded customer and purchases from DB
    await pool.query('DELETE FROM purchases WHERE customer_id = $1', [customerId]);
    await pool.query('DELETE FROM customers WHERE customer_id = $1', [customerId]);
    logger.info('Database cleanup complete.');

    logger.info('\n===============================================');
    logger.info('Admin Purchases API Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error running admin purchases integration tests:', error);
  }
};

runTests().then(() => {
  process.exit(0);
});
