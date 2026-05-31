import logger from '../src/utils/logger.js';

const BASE_URL = 'http://localhost:5000/api/v1';

const testGetters = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Public Base Getters API Tests...');
    logger.info('===============================================');

    // 1. Test GET /genres
    logger.info('\n[Test 1] GET /genres:');
    const genreRes = await fetch(`${BASE_URL}/genres`);
    const genreData = await genreRes.json();
    logger.info(`Status: ${genreRes.status}`);
    logger.info('Response genres count:', genreData.data?.genres?.length);
    logger.info('Genres data sample:', JSON.stringify(genreData.data?.genres?.slice(0, 3), null, 2));

    // 2. Test GET /moods
    logger.info('\n[Test 2] GET /moods:');
    const moodRes = await fetch(`${BASE_URL}/moods`);
    const moodData = await moodRes.json();
    logger.info(`Status: ${moodRes.status}`);
    logger.info('Response moods count:', moodData.data?.moods?.length);
    logger.info('Moods data sample:', JSON.stringify(moodData.data?.moods?.slice(0, 3), null, 2));

    // 3. Test GET /tags
    logger.info('\n[Test 3] GET /tags:');
    const tagRes = await fetch(`${BASE_URL}/tags`);
    const tagData = await tagRes.json();
    logger.info(`Status: ${tagRes.status}`);
    logger.info('Response tags count:', tagData.data?.tags?.length);
    logger.info('Tags data sample:', JSON.stringify(tagData.data?.tags?.slice(0, 3), null, 2));

    // 4. Test GET /license-plans
    logger.info('\n[Test 4] GET /license-plans:');
    const licenseRes = await fetch(`${BASE_URL}/license-plans`);
    const licenseData = await licenseRes.json();
    logger.info(`Status: ${licenseRes.status}`);
    logger.info('Response license-plans count:', licenseData.data?.licensePlans?.length);
    logger.info('License plans:', JSON.stringify(licenseData.data?.licensePlans, null, 2));

    // Check that inactive license plan is NOT present
    const inactiveFound = licenseData.data?.licensePlans?.some(plan => plan.slug === 'inactive-license-plan');
    logger.info('\n[Validation] Is inactive plan hidden?', !inactiveFound ? 'YES (PASSED)' : 'NO (FAILED)');

    logger.info('\n===============================================');
    logger.info('Public Base Getters API Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error executing getters tests:', error);
  }
};

testGetters();
