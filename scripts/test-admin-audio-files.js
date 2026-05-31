import jwt from 'jsonwebtoken';
import logger from '../src/utils/logger.js';

const BASE_URL = 'http://localhost:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_music_market_2026';

const runTests = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Track Audio Files Management Tests...');
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

    // Fetch Producer's owned track
    logger.info('\n[Setup] Fetching a track owned by Producer...');
    const trackRes = await fetch(`${BASE_URL}/tracks/chill-lofi-beats`);
    const trackData = await trackRes.json();
    const track = trackData.data?.track;
    const trackId = track?.track_id;
    logger.info(`Track ID: ${trackId}, Title: "${track?.title}", Owner ID: ${track?.owner?.user_id}`);

    if (!trackId) {
      logger.error('Could not load test track. Make sure seed data exists. Aborting tests.');
      return;
    }

    // 2. Add preview file (Valid)
    logger.info('\n[Test 1] POST /admin/tracks/:trackId/audio-files (Producer adding preview file):');
    const addPreviewRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/audio-files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        file_type: 'preview',
        file_url: 'https://cdn.musicmarket.com/previews/track1-preview.mp3',
        file_name: 'track1-preview.mp3',
        mime_type: 'audio/mpeg',
        file_size_bytes: 1245600,
        is_public: true,
        is_downloadable: false
      })
    });
    const addPreviewData = await addPreviewRes.json();
    logger.info(`Status: ${addPreviewRes.status} (Expected: 201)`);
    logger.info(`Added File:`, JSON.stringify(addPreviewData.data?.audio_file));

    const previewAudioId = addPreviewData.data?.audio_file?.audio_id;

    // 3. Privacy Rule: Force is_public = false for original files
    logger.info('\n[Test 2] POST /admin/tracks/:trackId/audio-files (Producer adding original file with is_public: true):');
    const addOriginalRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/audio-files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        file_type: 'original',
        file_url: 'https://cdn.musicmarket.com/originals/track1-original.wav',
        file_name: 'track1-original.wav',
        mime_type: 'audio/wav',
        file_size_bytes: 25489000,
        is_public: true, // Should be overridden to false
        is_downloadable: true
      })
    });
    const addOriginalData = await addOriginalRes.json();
    logger.info(`Status: ${addOriginalRes.status} (Expected: 201)`);
    logger.info(`File Type: "${addOriginalData.data?.audio_file?.file_type}"`);
    logger.info(`Is Public: ${addOriginalData.data?.audio_file?.is_public} (Expected: false)`);

    const originalAudioId = addOriginalData.data?.audio_file?.audio_id;

    // 4. File Type Validation Check
    logger.info('\n[Test 3] POST /admin/tracks/:trackId/audio-files (Invalid file_type value):');
    const invalidTypeRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/audio-files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        file_type: 'invalid-type-xyz',
        file_url: 'https://cdn.musicmarket.com/invalid.mp3'
      })
    });
    const invalidTypeData = await invalidTypeRes.json();
    logger.info(`Status: ${invalidTypeRes.status} (Expected: 400)`);
    logger.info(`Response:`, JSON.stringify(invalidTypeData, null, 2));

    // 5. Cross-Producer Forbidden Check on Adding File
    logger.info('\n[Test 4] POST /admin/tracks/:trackId/audio-files (Mock Producer adding file - Forbidden Check):');
    const crossAddRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/audio-files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockProducerToken}`
      },
      body: JSON.stringify({
        file_type: 'preview',
        file_url: 'https://cdn.musicmarket.com/previews/hacker.mp3'
      })
    });
    const crossAddData = await crossAddRes.json();
    logger.info(`Status: ${crossAddRes.status} (Expected: 403)`);
    logger.info(`Response:`, JSON.stringify(crossAddData, null, 2));

    // 6. List audio files
    logger.info('\n[Test 5] GET /admin/tracks/:trackId/audio-files (Producer listing audio files):');
    const listRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/audio-files`, {
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const listData = await listRes.json();
    logger.info(`Status: ${listRes.status} (Expected: 200)`);
    logger.info(`Files found: ${listData.data?.audio_files?.length}`);

    // 7. Update file metadata (Producer updates own file)
    logger.info('\n[Test 6] PUT /admin/audio-files/:audioId (Producer updating file name and trying to make original public):');
    const updateRes = await fetch(`${BASE_URL}/admin/audio-files/${originalAudioId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${prodToken}`
      },
      body: JSON.stringify({
        file_name: 'updated-original-filename.wav',
        is_public: true // Should still be overridden to false since type is original
      })
    });
    const updateData = await updateRes.json();
    logger.info(`Status: ${updateRes.status} (Expected: 200)`);
    logger.info(`Updated File Name: "${updateData.data?.audio_file?.file_name}"`);
    logger.info(`Is Public: ${updateData.data?.audio_file?.is_public} (Expected: false)`);

    // 8. Cross-Producer Forbidden Check on Updating File
    logger.info('\n[Test 7] PUT /admin/audio-files/:audioId (Mock Producer updating file - Forbidden Check):');
    const crossUpdateRes = await fetch(`${BASE_URL}/admin/audio-files/${originalAudioId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockProducerToken}`
      },
      body: JSON.stringify({
        file_name: 'hacked.wav'
      })
    });
    const crossUpdateData = await crossUpdateRes.json();
    logger.info(`Status: ${crossUpdateRes.status} (Expected: 403)`);
    logger.info(`Response:`, JSON.stringify(crossUpdateData, null, 2));

    // 9. Delete files
    logger.info('\n[Test 8] DELETE /admin/audio-files/:audioId (Producer deleting preview file):');
    const deletePreviewRes = await fetch(`${BASE_URL}/admin/audio-files/${previewAudioId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    logger.info(`Status: ${deletePreviewRes.status} (Expected: 200)`);

    logger.info('\n[Test 9] DELETE /admin/audio-files/:audioId (Producer deleting original file):');
    const deleteOriginalRes = await fetch(`${BASE_URL}/admin/audio-files/${originalAudioId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    logger.info(`Status: ${deleteOriginalRes.status} (Expected: 200)`);

    // 10. Verify empty list
    logger.info('\n[Test 10] GET /admin/tracks/:trackId/audio-files (Producer listing after deletion):');
    const listFinalRes = await fetch(`${BASE_URL}/admin/tracks/${trackId}/audio-files`, {
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const listFinalData = await listFinalRes.json();
    logger.info(`Status: ${listFinalRes.status} (Expected: 200)`);
    logger.info(`Files found: ${listFinalData.data?.audio_files?.length} (Expected: 0)`);

    logger.info('\n===============================================');
    logger.info('Track Audio Files Management Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error running audio file management integration tests:', error);
  }
};

runTests();
