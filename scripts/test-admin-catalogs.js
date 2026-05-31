import jwt from 'jsonwebtoken';
import logger from '../src/utils/logger.js';

const BASE_URL = 'http://localhost:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_music_market_2026';

const runTests = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Admin Catalog Management Tests...');
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

    // 2. Genre CRUD: Admin Create Genre
    logger.info('\n[Test 1] POST /admin/genres (Admin creating new genre):');
    const createGenreRes = await fetch(`${BASE_URL}/admin/genres`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        genre_name: 'Synthwave',
        slug: 'synthwave'
      })
    });
    const createGenreData = await createGenreRes.json();
    logger.info(`Status: ${createGenreRes.status} (Expected: 201)`);
    logger.info(`Created Genre:`, JSON.stringify(createGenreData.data?.genre));

    const genreId = createGenreData.data?.genre?.genre_id;

    // 3. Genre CRUD: Producer Create Genre (Forbidden Check)
    logger.info('\n[Test 2] POST /admin/genres (Producer trying to create genre - Forbidden Check):');
    const prodGenreRes = await fetch(`${BASE_URL}/admin/genres`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        genre_name: 'Forbidden Genre'
      })
    });
    const prodGenreData = await prodGenreRes.json();
    logger.info(`Status: ${prodGenreRes.status} (Expected: 403)`);
    logger.info(`Response:`, JSON.stringify(prodGenreData, null, 2));

    // 4. Genre CRUD: Admin Update Genre
    logger.info('\n[Test 3] PUT /admin/genres/:genreId (Admin updating genre):');
    const updateGenreRes = await fetch(`${BASE_URL}/admin/genres/${genreId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        genre_name: 'Synthwave Beats'
      })
    });
    const updateGenreData = await updateGenreRes.json();
    logger.info(`Status: ${updateGenreRes.status} (Expected: 200)`);
    logger.info(`Updated Genre:`, JSON.stringify(updateGenreData.data?.genre));

    // 5. Genre CRUD: Admin Delete Genre
    logger.info('\n[Test 4] DELETE /admin/genres/:genreId (Admin deleting genre):');
    const deleteGenreRes = await fetch(`${BASE_URL}/admin/genres/${genreId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    logger.info(`Status: ${deleteGenreRes.status} (Expected: 200)`);

    // 6. Track Assignments: Get track to assign
    logger.info('\n[Setup] Fetching a published track owned by Producer...');
    const trackRes = await fetch(`${BASE_URL}/tracks/chill-lofi-beats`);
    const trackData = await trackRes.json();
    const track = trackData.data?.track;
    const trackId = track?.track_id;
    logger.info(`Track ID: ${trackId}, Owner ID: ${track?.owner?.user_id}`);

    // Fetch list of genres to get some active IDs
    logger.info('\n[Setup] Fetching active genres list...');
    const genresRes = await fetch(`${BASE_URL}/genres`);
    const genresData = await genresRes.json();
    const genreIds = genresData.data?.genres?.map(g => parseInt(g.genre_id, 10)) || [];
    logger.info(`Active Genre IDs in DB: ${JSON.stringify(genreIds)}`);

    // 7. Track Assignment: Valid assignment
    logger.info('\n[Test 5] PUT /admin/tracks/:trackId/genres (Producer assigning valid genres to own track):');
    const assignRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/genres`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        genre_ids: genreIds.slice(0, 2)
      })
    });
    const assignData = await assignRes.json();
    logger.info(`Status: ${assignRes.status} (Expected: 200)`);
    logger.info(`Response:`, JSON.stringify(assignData, null, 2));

    // 8. Track Assignment: Forbidden Check
    logger.info('\n[Test 6] PUT /admin/tracks/:trackId/genres (Mock Producer assigning genres - Forbidden Check):');
    const crossAssignRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/genres`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockProducerToken}`
      },
      body: JSON.stringify({
        genre_ids: genreIds.slice(0, 2)
      })
    });
    const crossAssignData = await crossAssignRes.json();
    logger.info(`Status: ${crossAssignRes.status} (Expected: 403)`);
    logger.info(`Response:`, JSON.stringify(crossAssignData, null, 2));

    // 9. Track Assignment: Non-existent genre IDs validation
    logger.info('\n[Test 7] PUT /admin/tracks/:trackId/genres (Producer assigning non-existent genre ID - Validation Check):');
    const invalidAssignRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/genres`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        genre_ids: [99999]
      })
    });
    const invalidAssignData = await invalidAssignRes.json();
    logger.info(`Status: ${invalidAssignRes.status} (Expected: 400)`);
    logger.info(`Response:`, JSON.stringify(invalidAssignData, null, 2));

    logger.info('\n===============================================');
    logger.info('Admin Catalog Management Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error running catalog tests:', error);
  }
};

runTests();
