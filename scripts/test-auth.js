import logger from '../src/utils/logger.js';

const BASE_URL = 'http://localhost:5000/api/v1';

const testAuth = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Authentication API Tests...');
    logger.info('===============================================');

    // Test Case 1: Login with correct Admin credentials
    logger.info('\n[Test 1] Login with valid Admin credentials:');
    const loginRes1 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@musicmarket.com', password: 'adminpassword' })
    });
    const loginData1 = await loginRes1.json();
    logger.info(`Status: ${loginRes1.status}`);
    logger.info('Response:', JSON.stringify(loginData1, null, 2));

    const token = loginData1.data?.token;

    // Test Case 2: Login with correct Producer credentials
    logger.info('\n[Test 2] Login with valid Producer credentials:');
    const loginRes2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'producer@musicmarket.com', password: 'producerpassword' })
    });
    const loginData2 = await loginRes2.json();
    logger.info(`Status: ${loginRes2.status}`);
    logger.info('Response:', JSON.stringify(loginData2, null, 2));

    // Test Case 3: Login with invalid password
    logger.info('\n[Test 3] Login with invalid password:');
    const loginRes3 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@musicmarket.com', password: 'wrongpassword' })
    });
    const loginData3 = await loginRes3.json();
    logger.info(`Status: ${loginRes3.status}`);
    logger.info('Response:', JSON.stringify(loginData3, null, 2));

    // Test Case 4: Login with blocked user
    logger.info('\n[Test 4] Login with blocked user (is_active = false):');
    const loginRes4 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'blocked@musicmarket.com', password: 'blockedpassword' })
    });
    const loginData4 = await loginRes4.json();
    logger.info(`Status: ${loginRes4.status}`);
    logger.info('Response:', JSON.stringify(loginData4, null, 2));

    // Test Case 5: GET /me without token
    logger.info('\n[Test 5] GET /auth/me without token:');
    const meRes1 = await fetch(`${BASE_URL}/auth/me`);
    const meData1 = await meRes1.json();
    logger.info(`Status: ${meRes1.status}`);
    logger.info('Response:', JSON.stringify(meData1, null, 2));

    // Test Case 6: GET /me with invalid token
    logger.info('\n[Test 6] GET /auth/me with invalid token:');
    const meRes2 = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': 'Bearer invalid_token_value' }
    });
    const meData2 = await meRes2.json();
    logger.info(`Status: ${meRes2.status}`);
    logger.info('Response:', JSON.stringify(meData2, null, 2));

    // Test Case 7: GET /me with valid token
    if (token) {
      logger.info('\n[Test 7] GET /auth/me with valid token:');
      const meRes3 = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meData3 = await meRes3.json();
      logger.info(`Status: ${meRes3.status}`);
      logger.info('Response:', JSON.stringify(meData3, null, 2));
    } else {
      logger.warn('\n[Test 7] Skipped: No valid token available from Test 1');
    }

    logger.info('\n===============================================');
    logger.info('Authentication API Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error executing authentication tests:', error);
  }
};

testAuth();
