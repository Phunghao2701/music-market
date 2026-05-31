import jwt from 'jsonwebtoken';
import logger from '../src/utils/logger.js';

const BASE_URL = 'http://localhost:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_music_market_2026';

const runTests = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Track License Options Management Tests...');
    logger.info('===============================================');

    // 1. Authenticate users
    logger.info('\n[Setup] Logging in users...');
    
    // Login Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@musicmarket.com', password: 'adminpassword' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data?.token;

    // Login Producer
    const prodLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'producer@musicmarket.com', password: 'producerpassword' })
    });
    const prodLoginData = await prodLoginRes.json();
    const prodToken = prodLoginData.data?.token;

    // Sign mock token for a different producer to test forbidden cross-access
    const mockProducerToken = jwt.sign(
      { user_id: '88888888-8888-8888-8888-888888888888', email: 'mockprod@musicmarket.com', role: 'producer' },
      JWT_SECRET
    );

    logger.info(`Admin Token: ${!!adminToken}`);
    logger.info(`Producer Token: ${!!prodToken}`);
    logger.info(`Mock Producer Token: ${!!mockProducerToken}`);

    // Create a temporary track as Producer for the tests
    logger.info('\n[Setup] Creating temporary track for Producer...');
    const trackRes = await fetch(`${BASE_URL}/admin/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        title: `License Option Test Track ${Date.now()}`,
        description: 'Temporary track to test track license options.',
        bpm: 120,
        musical_key: 'A Major',
        duration_seconds: 180,
        genres: ['pop'],
        moods: ['happy'],
        tags: ['synth']
      })
    });
    const trackData = await trackRes.json();
    const trackId = trackData.data?.track?.track_id;
    if (!trackId) {
      logger.error('Failed to create temporary track. Aborting.');
      return;
    }
    logger.info(`Created temporary Track ID: ${trackId}`);

    // Fetch active license plans to get valid license plan IDs
    logger.info('\n[Setup] Fetching active license plans...');
    const plansRes = await fetch(`${BASE_URL}/admin/license-plans`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const plansData = await plansRes.json();
    const activePlans = plansData.data?.license_plans?.filter(p => p.is_active) || [];
    
    if (activePlans.length < 2) {
      logger.error('Need at least 2 active license plans to run tests properly. Please seed or create them.');
      return;
    }

    const plan1 = activePlans[0];
    const plan2 = activePlans[1];
    logger.info(`Plan 1: ${plan1.license_name} (ID: ${plan1.license_id}, Default Price: ${plan1.default_price})`);
    logger.info(`Plan 2: ${plan2.license_name} (ID: ${plan2.license_id}, Default Price: ${plan2.default_price})`);

    // ==============================================================
    // [Test 1] GET /admin/tracks/:trackId/license-options (Initial)
    // ==============================================================
    logger.info('\n[Test 1] GET initial license options (Should be empty):');
    const getInitialRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/license-options`, {
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const getInitialData = await getInitialRes.json();
    logger.info(`Status: ${getInitialRes.status} (Expected: 200)`);
    logger.info(`Options count: ${getInitialData.data?.license_options?.length} (Expected: 0)`);

    // ==============================================================
    // [Test 2] POST /admin/tracks/:trackId/license-options (With custom price)
    // ==============================================================
    logger.info('\n[Test 2] POST license option with custom price:');
    const postCustomPriceRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/license-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        license_plan_id: plan1.license_id,
        price: 800000,
        currency: 'VND',
        is_available: true,
        custom_terms: 'Custom terms for standard plan.'
      })
    });
    const postCustomPriceData = await postCustomPriceRes.json();
    logger.info(`Status: ${postCustomPriceRes.status} (Expected: 201)`);
    logger.info(`Price in response: ${postCustomPriceData.data?.license_option?.price} (Expected: 800000)`);
    logger.info(`Currency in response: ${postCustomPriceData.data?.license_option?.currency} (Expected: VND)`);
    
    const option1Id = postCustomPriceData.data?.license_option?.license_option_id;

    // ==============================================================
    // [Test 3] POST /admin/tracks/:trackId/license-options (Default price fallback)
    // ==============================================================
    logger.info('\n[Test 3] POST license option with default price fallback (omitting price):');
    const postFallbackRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/license-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        license_plan_id: plan2.license_id,
        currency: 'VND'
      })
    });
    const postFallbackData = await postFallbackRes.json();
    logger.info(`Status: ${postFallbackRes.status} (Expected: 201)`);
    logger.info(`Price in response: ${postFallbackData.data?.license_option?.price} (Expected: ${plan2.default_price})`);
    
    const option2Id = postFallbackData.data?.license_option?.license_option_id;

    // ==============================================================
    // [Test 4] POST /admin/tracks/:trackId/license-options (Duplicate protection)
    // ==============================================================
    logger.info('\n[Test 4] POST license option with duplicate license_plan_id:');
    const postDupRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/license-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        license_plan_id: plan1.license_id,
        price: 900000
      })
    });
    const postDupData = await postDupRes.json();
    logger.info(`Status: ${postDupRes.status} (Expected: 400)`);
    logger.info(`Response message: "${postDupData.message}"`);

    // ==============================================================
    // [Test 5] Cross-access verification (Mock Producer on Producer track)
    // ==============================================================
    logger.info('\n[Test 5] POST license option by mock producer on owner track (Forbidden):');
    const postOtherRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/license-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockProducerToken}`
      },
      body: JSON.stringify({
        license_plan_id: plan1.license_id,
        price: 500000
      })
    });
    const postOtherData = await postOtherRes.json();
    logger.info(`Status: ${postOtherRes.status} (Expected: 403)`);
    logger.info(`Response message: "${postOtherData.message}"`);

    // ==============================================================
    // [Test 6] GET /admin/tracks/:trackId/license-options (List check)
    // ==============================================================
    logger.info('\n[Test 6] GET list license options (Should contain 2 options, sorted by price):');
    const getListRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/license-options`, {
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const getListData = await getListRes.json();
    logger.info(`Status: ${getListRes.status} (Expected: 200)`);
    logger.info(`Options count: ${getListData.data?.license_options?.length} (Expected: 2)`);
    logger.info(`First option price: ${getListData.data?.license_options?.[0]?.price}`);
    logger.info(`Second option price: ${getListData.data?.license_options?.[1]?.price}`);

    // ==============================================================
    // [Test 7] PUT /admin/track-license-options/:licenseOptionId (Update)
    // ==============================================================
    logger.info('\n[Test 7] PUT update license option price and custom terms:');
    const putUpdateRes = await fetch(`${BASE_URL}/admin/track-license-options/${option1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        price: 850000,
        custom_terms: 'Updated custom terms standard plan.'
      })
    });
    const putUpdateData = await putUpdateRes.json();
    logger.info(`Status: ${putUpdateRes.status} (Expected: 200)`);
    logger.info(`Updated price: ${putUpdateData.data?.license_option?.price} (Expected: 850000)`);
    logger.info(`Updated custom terms: "${putUpdateData.data?.license_option?.custom_terms}"`);

    // ==============================================================
    // [Test 8] PATCH /admin/track-license-options/:licenseOptionId/availability (Toggle Availability)
    // ==============================================================
    logger.info('\n[Test 8] PATCH update availability status to false:');
    const patchAvailRes = await fetch(`${BASE_URL}/admin/track-license-options/${option1Id}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({ is_available: false })
    });
    const patchAvailData = await patchAvailRes.json();
    logger.info(`Status: ${patchAvailRes.status} (Expected: 200)`);
    logger.info(`Is available: ${patchAvailData.data?.license_option?.is_available} (Expected: false)`);

    // ==============================================================
    // [Test 9] DELETE /admin/track-license-options/:licenseOptionId (Delete)
    // ==============================================================
    logger.info('\n[Test 9] DELETE license option:');
    const deleteRes = await fetch(`${BASE_URL}/admin/track-license-options/${option1Id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const deleteData = await deleteRes.json();
    logger.info(`Status: ${deleteRes.status} (Expected: 200)`);
    logger.info(`Response success: ${deleteData.success}`);

    // Verification: GET license options list should now only contain 1 option
    const getFinalRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/license-options`, {
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const getFinalData = await getFinalRes.json();
    logger.info(`Options count after delete: ${getFinalData.data?.license_options?.length} (Expected: 1)`);

    // ==============================================================
    // [Cleanup] Delete temporary track
    // ==============================================================
    logger.info('\n[Cleanup] Deleting temporary track...');
    const cleanupRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    logger.info(`Track Cleanup Status: ${cleanupRes.status} (Expected: 200)`);

    logger.info('\n===============================================');
    logger.info('Track License Options Management Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error running track license options integration tests:', error);
  }
};

runTests();
