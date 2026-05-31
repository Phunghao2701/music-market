import logger from '../src/utils/logger.js';

const BASE_URL = 'http://localhost:5000/api/v1';

const testTracks = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Public Music Catalog API Tests...');
    logger.info('===============================================');

    // 1. GET /tracks (fetch all published tracks)
    logger.info('\n[Test 1] GET /tracks (all published):');
    const res1 = await fetch(`${BASE_URL}/tracks`);
    const data1 = await res1.json();
    logger.info(`Status: ${res1.status}`);
    logger.info(`Total published tracks: ${data1.data?.pagination?.total}`);
    logger.info(`Tracks returned: ${data1.data?.tracks?.length}`);
    const draftFound = data1.data?.tracks?.some(t => t.slug === 'unpublished-draft-track');
    const deletedFound = data1.data?.tracks?.some(t => t.slug === 'deleted-lofi-track');
    logger.info(`- Is draft track hidden? ${!draftFound ? 'YES (PASSED)' : 'NO (FAILED)'}`);
    logger.info(`- Is soft-deleted track hidden? ${!deletedFound ? 'YES (PASSED)' : 'NO (FAILED)'}`);

    // Sample list item to verify population
    if (data1.data?.tracks?.length > 0) {
      const sample = data1.data.tracks[0];
      logger.info('Sample track nested relations verify:');
      logger.info(`- Title: ${sample.title}`);
      logger.info(`- Owner username: ${sample.owner?.username}`);
      logger.info(`- Genres count: ${sample.genres?.length}`);
      logger.info(`- Moods count: ${sample.moods?.length}`);
      logger.info(`- Tags count: ${sample.tags?.length}`);
    }

    // 2. GET /tracks?search=lofi (search by title)
    logger.info('\n[Test 2] GET /tracks?search=lofi:');
    const res2 = await fetch(`${BASE_URL}/tracks?search=lofi`);
    const data2 = await res2.json();
    logger.info(`Status: ${res2.status}`);
    logger.info(`Matching search results count: ${data2.data?.tracks?.length}`);
    logger.info(`Matching track title: "${data2.data?.tracks?.[0]?.title}"`);

    // 3. GET /tracks?genre=cinematic (filter by genre slug)
    logger.info('\n[Test 3] GET /tracks?genre=cinematic:');
    const res3 = await fetch(`${BASE_URL}/tracks?genre=cinematic`);
    const data3 = await res3.json();
    logger.info(`Status: ${res3.status}`);
    logger.info(`Matching genre cinematic count: ${data3.data?.tracks?.length}`);
    logger.info(`Matching track title: "${data3.data?.tracks?.[0]?.title}"`);

    // 4. GET /tracks?bpm_min=100&bpm_max=150 (filter by BPM range)
    logger.info('\n[Test 4] GET /tracks?bpm_min=100&bpm_max=150:');
    const res4 = await fetch(`${BASE_URL}/tracks?bpm_min=100&bpm_max=150`);
    const data4 = await res4.json();
    logger.info(`Status: ${res4.status}`);
    logger.info(`Matching BPM range count: ${data4.data?.tracks?.length}`);
    data4.data?.tracks?.forEach(t => {
      logger.info(`- Track: "${t.title}" (BPM: ${t.bpm})`);
    });

    // 5. GET /tracks/featured (featured tracks)
    logger.info('\n[Test 5] GET /tracks/featured:');
    const res5 = await fetch(`${BASE_URL}/tracks/featured`);
    const data5 = await res5.json();
    logger.info(`Status: ${res5.status}`);
    logger.info(`Featured tracks count: ${data5.data?.tracks?.length}`);
    data5.data?.tracks?.forEach(t => {
      logger.info(`- Featured track: "${t.title}"`);
    });

    // 6. GET /tracks/:slug (atomic view count increment test)
    logger.info('\n[Test 6] GET /tracks/chill-lofi-beats (detailed view):');
    // Fetch 1st time
    const res6_1 = await fetch(`${BASE_URL}/tracks/chill-lofi-beats`);
    const data6_1 = await res6_1.json();
    const initialViews = data6_1.data?.track?.view_count;
    logger.info(`Initial view_count: ${initialViews}`);

    // Fetch 2nd time
    const res6_2 = await fetch(`${BASE_URL}/tracks/chill-lofi-beats`);
    const data6_2 = await res6_2.json();
    const newViews = data6_2.data?.track?.view_count;
    logger.info(`View count after reloading: ${newViews}`);
    logger.info(`- Did view count increment? ${newViews === initialViews + 1 ? 'YES (PASSED)' : 'NO (FAILED)'}`);

    const trackIdForRelated = data6_2.data?.track?.track_id;

    // 7. GET /tracks/:trackId/related (related tracks test)
    if (trackIdForRelated) {
      logger.info(`\n[Test 7] GET /tracks/${trackIdForRelated}/related:`);
      const res7 = await fetch(`${BASE_URL}/tracks/${trackIdForRelated}/related`);
      const data7 = await res7.json();
      logger.info(`Status: ${res7.status}`);
      logger.info(`Related tracks count: ${data7.data?.tracks?.length}`);
      data7.data?.tracks?.forEach(t => {
        logger.info(`- Related track: "${t.title}" (Score: ${t.score})`);
      });
    }

    // 8. GET /tracks/unpublished-draft-track (should fail 404)
    logger.info('\n[Test 8] GET /tracks/unpublished-draft-track (draft):');
    const res8 = await fetch(`${BASE_URL}/tracks/unpublished-draft-track`);
    const data8 = await res8.json();
    logger.info(`Status: ${res8.status} (Expected: 404)`);
    logger.info(`Response:`, JSON.stringify(data8, null, 2));

    // 9. GET /tracks/deleted-lofi-track (should fail 404)
    logger.info('\n[Test 9] GET /tracks/deleted-lofi-track (soft-deleted):');
    const res9 = await fetch(`${BASE_URL}/tracks/deleted-lofi-track`);
    const data9 = await res9.json();
    logger.info(`Status: ${res9.status} (Expected: 404)`);
    logger.info(`Response:`, JSON.stringify(data9, null, 2));

    logger.info('\n===============================================');
    logger.info('Public Music Catalog API Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error executing catalog tests:', error);
  }
};

testTracks();
