import logger from '../src/utils/logger.js';

const BASE_URL = 'http://localhost:5000/api/v1';

const testPlay = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Play Events API Integration Tests...');
    logger.info('===============================================');

    // 1. Fetch a track first to get its track_id and current play_count
    logger.info('\n[Setup] Fetching a published track...');
    const trackRes = await fetch(`${BASE_URL}/tracks/chill-lofi-beats`);
    const trackData = await trackRes.json();
    const track = trackData.data?.track;

    if (!track) {
      logger.error('Failed setup: No track found.');
      return;
    }

    const trackId = track.track_id;
    const initialPlayCount = track.play_count;
    logger.info(`Track: "${track.title}" (ID: ${trackId}, Current play_count: ${initialPlayCount})`);

    // 2. POST /tracks/:trackId/play (negative duration validation check)
    logger.info('\n[Test 1] POST /tracks/:trackId/play (Negative duration validation check):');
    const negRes = await fetch(`${BASE_URL}/tracks/${trackId}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ played_seconds: -15 })
    });
    const negData = await negRes.json();
    logger.info(`Status: ${negRes.status} (Expected: 400)`);
    logger.info(`Response:`, JSON.stringify(negData, null, 2));

    // 3. POST /tracks/:trackId/play (valid request)
    logger.info('\n[Test 2] POST /tracks/:trackId/play (Valid public request):');
    const validRes = await fetch(`${BASE_URL}/tracks/${trackId}/play`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Antigravity Testing Agent',
        'Referer': 'https://musicmarket.com/discover'
      },
      body: JSON.stringify({
        played_seconds: 45,
        listener_session_id: 'test_sess_999'
      })
    });
    const validData = await validRes.json();
    logger.info(`Status: ${validRes.status} (Expected: 201)`);
    logger.info(`Response:`, JSON.stringify(validData, null, 2));

    // 4. Verify track play count increased
    logger.info('\n[Test 3] Verifying track play_count incremented in DB:');
    const verifyRes = await fetch(`${BASE_URL}/tracks/chill-lofi-beats`);
    const verifyData = await verifyRes.json();
    const newPlayCount = verifyData.data?.track?.play_count;
    logger.info(`New play_count: ${newPlayCount}`);
    logger.info(`- Did play_count increment by 1? ${newPlayCount === initialPlayCount + 1 ? 'YES (PASSED)' : 'NO (FAILED)'}`);

    // 5. Authenticate Admin and Producer to get tokens
    logger.info('\n[Setup] Authenticating admin and producer accounts...');
    // Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@musicmarket.com', password: 'adminpassword' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data?.token;

    // Producer login
    const prodLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'producer@musicmarket.com', password: 'producerpassword' })
    });
    const prodLoginData = await prodLoginRes.json();
    const prodToken = prodLoginData.data?.token;

    logger.info(`Admin token available: ${!!adminToken}`);
    logger.info(`Producer token available: ${!!prodToken}`);

    // 6. GET /admin/tracks/:trackId/play-events (without token)
    logger.info('\n[Test 4] GET /admin/tracks/:trackId/play-events (No token provided):');
    const noTokenRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/play-events`);
    const noTokenData = await noTokenRes.json();
    logger.info(`Status: ${noTokenRes.status} (Expected: 401)`);
    logger.info(`Response:`, JSON.stringify(noTokenData, null, 2));

    // 7. GET /admin/tracks/:trackId/play-events (Producer token)
    logger.info('\n[Test 5] GET /admin/tracks/:trackId/play-events (Producer token - Forbidden check):');
    const prodRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/play-events`, {
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const prodData = await prodRes.json();
    logger.info(`Status: ${prodRes.status} (Expected: 403)`);
    logger.info(`Response:`, JSON.stringify(prodData, null, 2));

    // 8. GET /admin/tracks/:trackId/play-events (Admin token)
    logger.info('\n[Test 6] GET /admin/tracks/:trackId/play-events (Admin token - Allowed check):');
    const adminRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/play-events`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminData = await adminRes.json();
    logger.info(`Status: ${adminRes.status} (Expected: 200)`);
    logger.info(`Total events logged: ${adminData.data?.pagination?.total}`);
    logger.info(`First play event logged:`, JSON.stringify(adminData.data?.events?.[0], null, 2));

    logger.info('\n===============================================');
    logger.info('Play Events API Integration Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error executing play events tests:', error);
  }
};

testPlay();
