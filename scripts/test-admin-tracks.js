import jwt from 'jsonwebtoken';
import logger from '../src/utils/logger.js';

const BASE_URL = 'http://localhost:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_music_market_2026';

const runTests = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Admin/Producer Track Management Tests...');
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

    // 2. Create track (Valid)
    logger.info('\n[Test 1] Create track as Producer (Draft by default):');
    const testTitle = `Sunset Beach Chill ${Date.now()}`;
    const createRes = await fetch(`${BASE_URL}/admin/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        title: testTitle,
        description: 'Vibe out by the seaside with this lo-fi jam.',
        bpm: 78,
        musical_key: 'E Minor',
        duration_seconds: 165,
        genres: ['lo-fi', 'hip-hop'],
        moods: ['happy'],
        tags: ['synth', 'guitar']
      })
    });
    const createData = await createRes.json();
    logger.info(`Status: ${createRes.status} (Expected: 201)`);
    logger.info(`Response track title: "${createData.data?.track?.title}"`);
    logger.info(`Response track status: "${createData.data?.track?.status}" (Expected: "draft")`);
    logger.info(`Resolved Genres:`, JSON.stringify(createData.data?.track?.genres));
    logger.info(`Resolved Moods:`, JSON.stringify(createData.data?.track?.moods));
    logger.info(`Resolved Tags:`, JSON.stringify(createData.data?.track?.tags));

    const trackId = createData.data?.track?.track_id;
    if (!trackId) {
      logger.error('Failed to create track. Aborting remaining tests.');
      return;
    }

    const createdSlug = createData.data?.track?.slug;

    // 3. Duplicate Slug check
    logger.info('\n[Test 2] Create track with duplicate slug:');
    const dupRes = await fetch(`${BASE_URL}/admin/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        title: 'Different Title But Same Slug',
        slug: createdSlug
      })
    });
    const dupData = await dupRes.json();
    logger.info(`Status: ${dupRes.status} (Expected: 400)`);
    logger.info(`Response:`, JSON.stringify(dupData, null, 2));

    // 4. Get track details in admin
    logger.info('\n[Test 3] GET /admin/tracks/:trackId (Producer viewing own track):');
    const getOwnRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}`, {
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const getOwnData = await getOwnRes.json();
    logger.info(`Status: ${getOwnRes.status} (Expected: 200)`);
    logger.info(`Track title: "${getOwnData.data?.track?.title}"`);

    // 5. Cross-Producer Forbidden Access
    logger.info('\n[Test 4] GET /admin/tracks/:trackId (Mock Producer viewing track of another):');
    const getOtherRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}`, {
      headers: { 'Authorization': `Bearer ${mockProducerToken}` }
    });
    const getOtherData = await getOtherRes.json();
    logger.info(`Status: ${getOtherRes.status} (Expected: 403)`);
    logger.info(`Response:`, JSON.stringify(getOtherData, null, 2));

    // 6. Update track details (Owner Producer)
    logger.info('\n[Test 5] PUT /admin/tracks/:trackId (Owner updating title and replacing moods/tags):');
    const updateRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        title: 'Sunset Beach Chill - Updated',
        moods: ['sad', 'dark'],
        tags: ['drums']
      })
    });
    const updateData = await updateRes.json();
    logger.info(`Status: ${updateRes.status} (Expected: 200)`);
    logger.info(`Updated title: "${updateData.data?.track?.title}"`);
    logger.info(`Updated Moods:`, JSON.stringify(updateData.data?.track?.moods));
    logger.info(`Updated Tags:`, JSON.stringify(updateData.data?.track?.tags));

    // 7. Update status to invalid value
    logger.info('\n[Test 6] PATCH /admin/tracks/:trackId/status (Invalid status value):');
    const statusInvalidRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({ status: 'super-published' })
    });
    const statusInvalidData = await statusInvalidRes.json();
    logger.info(`Status: ${statusInvalidRes.status} (Expected: 400)`);
    logger.info(`Response:`, JSON.stringify(statusInvalidData, null, 2));

    // 8. Update status to 'published'
    logger.info('\n[Test 7] PATCH /admin/tracks/:trackId/status (Publishing track):');
    const statusValidRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({ status: 'published' })
    });
    const statusValidData = await statusValidRes.json();
    logger.info(`Status: ${statusValidRes.status} (Expected: 200)`);
    logger.info(`New Status: "${statusValidData.data?.track?.status}"`);

    // 9. Admin view lists
    logger.info('\n[Test 8] GET /admin/tracks (Admin lists all):');
    const adminListRes = await fetch(`${BASE_URL}/admin/tracks`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminListData = await adminListRes.json();
    logger.info(`Status: ${adminListRes.status} (Expected: 200)`);
    logger.info(`Tracks count returned: ${adminListData.data?.tracks?.length}`);
    const foundTrack = adminListData.data?.tracks?.find(t => parseInt(t.track_id, 10) === parseInt(trackId, 10));
    logger.info(`Found track we created? ${foundTrack ? 'YES (PASSED)' : 'NO (FAILED)'}`);

    // 10. Producer view lists
    logger.info('\n[Test 9] GET /admin/tracks (Mock Producer lists all):');
    const mockListRes = await fetch(`${BASE_URL}/admin/tracks`, {
      headers: { 'Authorization': `Bearer ${mockProducerToken}` }
    });
    const mockListData = await mockListRes.json();
    logger.info(`Status: ${mockListRes.status} (Expected: 200)`);
    logger.info(`Tracks count returned (should be 0 for mock producer): ${mockListData.data?.tracks?.length}`);

    // 11. Soft delete track
    logger.info('\n[Test 10] DELETE /admin/tracks/:trackId (Producer soft-deletes own track):');
    const deleteRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const deleteData = await deleteRes.json();
    logger.info(`Status: ${deleteRes.status} (Expected: 200)`);
    logger.info(`Response:`, JSON.stringify(deleteData, null, 2));

    // 12. Verification: GET details fails with 404 since it is soft deleted
    logger.info('\n[Test 11] Verification: GET detail fails with 404 (Soft deleted check):');
    const getDeletedRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}`, {
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const getDeletedData = await getDeletedRes.json();
    logger.info(`Status: ${getDeletedRes.status} (Expected: 404)`);
    logger.info(`Response:`, JSON.stringify(getDeletedData, null, 2));

    logger.info('\n===============================================');
    logger.info('Admin/Producer Track Management Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error running admin track management integration tests:', error);
  }
};

runTests();
