import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';
import logger from '../src/utils/logger.js';

const seedUsers = async () => {
  try {
    logger.info('Starting user database seeding...');

    // 1. Clear existing users to ensure clean state
    await pool.query('DELETE FROM users');
    logger.info('Cleaned up existing users table.');

    // 2. Hash passwords
    const adminHash = await bcrypt.hash('adminpassword', 10);
    const producerHash = await bcrypt.hash('producerpassword', 10);

    // 3. Insert Admin User
    const adminQuery = `
      INSERT INTO users (username, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, username, email, role
    `;
    const adminValues = ['Admin User', 'admin@musicmarket.com', adminHash, 'admin', true];
    const adminResult = await pool.query(adminQuery, adminValues);
    logger.info(`Seeded Admin User: ${adminResult.rows[0].email} (ID: ${adminResult.rows[0].user_id})`);

    // 4. Insert Producer User
    const producerQuery = `
      INSERT INTO users (username, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, username, email, role
    `;
    const producerValues = ['Producer User', 'producer@musicmarket.com', producerHash, 'producer', true];
    const producerResult = await pool.query(producerQuery, producerValues);
    logger.info(`Seeded Producer User: ${producerResult.rows[0].email} (ID: ${producerResult.rows[0].user_id})`);

    // 5. Insert Inactive User for testing blocked accounts
    const inactiveHash = await bcrypt.hash('blockedpassword', 10);
    const inactiveQuery = `
      INSERT INTO users (username, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, username, email, role
    `;
    const inactiveValues = ['Blocked User', 'blocked@musicmarket.com', inactiveHash, 'producer', false];
    const inactiveResult = await pool.query(inactiveQuery, inactiveValues);
    logger.info(`Seeded Blocked User: ${inactiveResult.rows[0].email} (ID: ${inactiveResult.rows[0].user_id})`);

    logger.info('User database seeding completed successfully!');
  } catch (error) {
    logger.error('Error seeding users database:', error);
  } finally {
    await pool.end();
    logger.info('Database pool connection closed.');
    process.exit(0);
  }
};

seedUsers();
