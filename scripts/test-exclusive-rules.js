import logger from '../src/utils/logger.js';
import pool from '../src/config/database.js';

const BASE_URL = 'http://localhost:5000/api/v1';

const runTests = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Exclusive / Non-exclusive Rule Tests...');
    logger.info('===============================================');

    // 1. Authenticate admin
    logger.info('\n[Setup] Logging in Admin...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@musicmarket.com', password: 'adminpassword' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data?.token;

    // Create a customer
    logger.info('\n[Setup] Seeding test customer...');
    const customerRes = await pool.query(
      `INSERT INTO customers (customer_name, customer_email, customer_phone) 
       VALUES ($1, $2, $3) RETURNING customer_id`,
      [`Rule Customer ${Date.now()}`, `rule_${Date.now()}@example.com`, '888888888']
    );
    const customerId = customerRes.rows[0].customer_id;

    // ==============================================================
    // [Scenario A] Non-exclusive purchases can be sold multiple times
    // ==============================================================
    logger.info('\n--- [Scenario A] Testing Non-exclusive Sales ---');
    
    // Create a track for non-exclusive test
    logger.info('[Setup] Creating track for non-exclusive testing...');
    const trackResA = await fetch(`${BASE_URL}/admin/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: `Non-Exclusive Test Track ${Date.now()}`,
        bpm: 120,
        musical_key: 'C Major',
        duration_seconds: 180,
        status: 'published',
        allow_inquiry: true
      })
    });
    const trackDataA = await trackResA.json();
    const trackIdA = trackDataA.data?.track?.track_id;

    // 1. Create first completed non-exclusive purchase
    logger.info('[Test A.1] Creating first completed non-exclusive purchase:');
    const pA1Res = await fetch(`${BASE_URL}/admin/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        customer_id: customerId,
        track_id: trackIdA,
        license_name: 'Standard License',
        is_exclusive: false,
        final_price: 150000,
        currency: 'VND',
        status: 'completed'
      })
    });
    const pA1Data = await pA1Res.json();
    logger.info(`Status: ${pA1Res.status} (Expected: 201)`);
    
    // Check track status
    const trackCheckA1 = await pool.query('SELECT status FROM tracks WHERE track_id = $1', [trackIdA]);
    logger.info(`Track Status: "${trackCheckA1.rows[0].status}" (Expected: "sold_non_exclusive")`);

    // 2. Create second completed non-exclusive purchase for the same track (should succeed)
    logger.info('[Test A.2] Creating second completed non-exclusive purchase:');
    const pA2Res = await fetch(`${BASE_URL}/admin/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        customer_id: customerId,
        track_id: trackIdA,
        license_name: 'Premium License',
        is_exclusive: false,
        final_price: 250000,
        currency: 'VND',
        status: 'completed'
      })
    });
    const pA2Data = await pA2Res.json();
    logger.info(`Status: ${pA2Res.status} (Expected: 201)`);

    // Check track status
    const trackCheckA2 = await pool.query('SELECT status FROM tracks WHERE track_id = $1', [trackIdA]);
    logger.info(`Track Status: "${trackCheckA2.rows[0].status}" (Expected: "sold_non_exclusive")`);


    // ==============================================================
    // [Scenario B] Exclusive purchase can only be completed/paid once
    // ==============================================================
    logger.info('\n--- [Scenario B] Testing Exclusive Sales Constraint ---');

    // Create a track for exclusive test
    logger.info('[Setup] Creating track for exclusive testing...');
    const trackResB = await fetch(`${BASE_URL}/admin/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: `Exclusive Test Track ${Date.now()}`,
        bpm: 128,
        musical_key: 'F Minor',
        duration_seconds: 200,
        status: 'published',
        allow_inquiry: true
      })
    });
    const trackDataB = await trackResB.json();
    const trackIdB = trackDataB.data?.track?.track_id;

    // 1. Create first completed exclusive purchase
    logger.info('[Test B.1] Creating first completed exclusive purchase:');
    const pB1Res = await fetch(`${BASE_URL}/admin/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        customer_id: customerId,
        track_id: trackIdB,
        license_name: 'Exclusive License',
        is_exclusive: true,
        final_price: 5000000,
        currency: 'VND',
        status: 'completed'
      })
    });
    const pB1Data = await pB1Res.json();
    logger.info(`Status: ${pB1Res.status} (Expected: 201)`);

    // Check track status
    const trackCheckB1 = await pool.query('SELECT status FROM tracks WHERE track_id = $1', [trackIdB]);
    logger.info(`Track Status: "${trackCheckB1.rows[0].status}" (Expected: "sold_exclusive")`);

    // 2. Try to create second completed exclusive purchase (should fail)
    logger.info('[Test B.2] Creating second completed exclusive purchase (Should fail):');
    const pB2Res = await fetch(`${BASE_URL}/admin/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        customer_id: customerId,
        track_id: trackIdB,
        license_name: 'Exclusive License 2',
        is_exclusive: true,
        final_price: 6000000,
        currency: 'VND',
        status: 'completed'
      })
    });
    const pB2Data = await pB2Res.json();
    logger.info(`Status: ${pB2Res.status} (Expected: 400)`);
    logger.info(`Message: "${pB2Data.message}" (Expected: "Bài nhạc này đã có giao dịch độc quyền thành công.")`);

    // 3. Create a pending exclusive purchase (should succeed, since status is pending)
    logger.info('[Test B.3] Creating a pending exclusive purchase (Should succeed):');
    const pB3Res = await fetch(`${BASE_URL}/admin/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        customer_id: customerId,
        track_id: trackIdB,
        license_name: 'Exclusive License 3',
        is_exclusive: true,
        final_price: 7000000,
        currency: 'VND',
        status: 'pending'
      })
    });
    const pB3Data = await pB3Res.json();
    logger.info(`Status: ${pB3Res.status} (Expected: 201)`);
    const purchaseIdB3 = pB3Data.data?.purchase?.purchase_id;

    // 4. Try to update status of pending exclusive purchase to paid/completed (should fail)
    logger.info('[Test B.4] Updating pending exclusive purchase to paid status (Should fail):');
    const updateRes = await fetch(`${BASE_URL}/admin/purchases/${purchaseIdB3}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'paid' })
    });
    const updateData = await updateRes.json();
    logger.info(`Status: ${updateRes.status} (Expected: 400)`);
    logger.info(`Message: "${updateData.message}" (Expected: "Bài nhạc này đã có giao dịch độc quyền thành công.")`);

    // ==============================================================
    // [Cleanup] Database Cleanup
    // ==============================================================
    logger.info('\n[Cleanup] Cleaning up tracks and purchases...');
    await pool.query('DELETE FROM purchases WHERE customer_id = $1', [customerId]);
    await pool.query('DELETE FROM customers WHERE customer_id = $1', [customerId]);
    await pool.query('DELETE FROM tracks WHERE track_id IN ($1, $2)', [trackIdA, trackIdB]);
    logger.info('Database cleanup complete.');

    logger.info('\n===============================================');
    logger.info('Exclusive / Non-exclusive Rule Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error running exclusive/non-exclusive rules integration tests:', error);
  }
};

runTests().then(() => {
  process.exit(0);
});
