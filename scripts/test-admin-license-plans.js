import logger from '../src/utils/logger.js';

const BASE_URL = 'http://localhost:5000/api/v1';

const runTests = async () => {
  try {
    logger.info('===============================================');
    logger.info('Starting Admin License Plans Management Tests...');
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

    logger.info(`Admin Token: ${!!adminToken}`);
    logger.info(`Producer Token: ${!!prodToken}`);

    // 2. Access Restriction Check
    logger.info('\n[Test 1] GET /admin/license-plans (Producer accessing admin endpoint - Forbidden Check):');
    const prodGetRes = await fetch(`${BASE_URL}/admin/license-plans`, {
      headers: { 'Authorization': `Bearer ${prodToken}` }
    });
    const prodGetData = await prodGetRes.json();
    logger.info(`Status: ${prodGetRes.status} (Expected: 403)`);
    logger.info(`Response:`, JSON.stringify(prodGetData, null, 2));

    // 3. Admin Create License Plan (Valid)
    logger.info('\n[Test 2] POST /admin/license-plans (Admin creating new plan):');
    const dynamicSlug = `basic-license-${Date.now()}`;
    const createRes = await fetch(`${BASE_URL}/admin/license-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        license_name: 'Basic License Plan',
        slug: dynamicSlug,
        description: 'Basic standard usage license for independent creators.',
        usage_rights: 'Up to 50,000 non-monetized streams.',
        is_exclusive: false,
        default_price: 600000,
        currency: 'VND',
        is_active: true
      })
    });
    const createData = await createRes.json();
    logger.info(`Status: ${createRes.status} (Expected: 201)`);
    logger.info(`Created Plan:`, JSON.stringify(createData.data?.license_plan));

    const licenseId = createData.data?.license_plan?.license_id;
    if (!licenseId) {
      logger.error('Failed to create license plan. Aborting remaining tests.');
      return;
    }

    // 4. Slug Uniqueness Check
    logger.info('\n[Test 3] POST /admin/license-plans (Admin creating duplicate slug):');
    const dupRes = await fetch(`${BASE_URL}/admin/license-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        license_name: 'Another Plan Same Slug',
        slug: dynamicSlug
      })
    });
    const dupData = await dupRes.json();
    logger.info(`Status: ${dupRes.status} (Expected: 400)`);
    logger.info(`Response:`, JSON.stringify(dupData, null, 2));

    // 5. Admin Update License Plan
    logger.info('\n[Test 4] PUT /admin/license-plans/:licenseId (Admin updating details):');
    const updateRes = await fetch(`${BASE_URL}/admin/license-plans/${licenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        license_name: 'Basic License Plan (Updated)',
        default_price: 750000
      })
    });
    const updateData = await updateRes.json();
    logger.info(`Status: ${updateRes.status} (Expected: 200)`);
    logger.info(`Updated Name: "${updateData.data?.license_plan?.license_name}"`);
    logger.info(`Updated Price: ${updateData.data?.license_plan?.default_price} (Expected: 750000)`);

    // 6. Admin Toggle Status (Deactivate then Activate)
    logger.info('\n[Test 5] PATCH /admin/license-plans/:licenseId/status (Admin deactivating package):');
    const statusOffRes = await fetch(`${BASE_URL}/admin/license-plans/${licenseId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ is_active: false })
    });
    const statusOffData = await statusOffRes.json();
    logger.info(`Status: ${statusOffRes.status} (Expected: 200)`);
    logger.info(`Active status in response: ${statusOffData.data?.license_plan?.is_active} (Expected: false)`);

    logger.info('\n[Test 6] PATCH /admin/license-plans/:licenseId/status (Admin activating package back):');
    const statusOnRes = await fetch(`${BASE_URL}/admin/license-plans/${licenseId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ is_active: true })
    });
    const statusOnData = await statusOnRes.json();
    logger.info(`Status: ${statusOnRes.status} (Expected: 200)`);
    logger.info(`Active status in response: ${statusOnData.data?.license_plan?.is_active} (Expected: true)`);

    // 7. Safe Deactivation (DELETE)
    logger.info('\n[Test 7] DELETE /admin/license-plans/:licenseId (Admin deleting / safe-deactivating):');
    const deleteRes = await fetch(`${BASE_URL}/admin/license-plans/${licenseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const deleteData = await deleteRes.json();
    logger.info(`Status: ${deleteRes.status} (Expected: 200)`);
    logger.info(`Active status in delete response: ${deleteData.data?.license_plan?.is_active} (Expected: false)`);

    // 8. Admin GET lists
    logger.info('\n[Test 8] GET /admin/license-plans (Admin lists all):');
    const listRes = await fetch(`${BASE_URL}/admin/license-plans`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const listData = await listRes.json();
    logger.info(`Status: ${listRes.status} (Expected: 200)`);
    logger.info(`Total plans returned: ${listData.data?.license_plans?.length}`);
    const foundPlan = listData.data?.license_plans?.find(p => parseInt(p.license_id, 10) === parseInt(licenseId, 10));
    logger.info(`Found our deactivated test plan in list? ${foundPlan ? 'YES' : 'NO'}`);
    logger.info(`Deactivated plan's active status in list: ${foundPlan?.is_active} (Expected: false)`);

    logger.info('\n===============================================');
    logger.info('Admin License Plans Management Tests Completed.');
    logger.info('===============================================');
  } catch (error) {
    logger.error('Error running admin license plans integration tests:', error);
  }
};

runTests();
