import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';
import logger from '../src/utils/logger.js';

const seedDatabase = async () => {
  try {
    logger.info('Starting full database seeding (users, genres, moods, tags, and license plans)...');

    // 1. Clear existing table records
    await pool.query('DELETE FROM track_license_options');
    await pool.query('DELETE FROM license_plans');
    await pool.query('DELETE FROM track_tags');
    await pool.query('DELETE FROM tags');
    await pool.query('DELETE FROM track_moods');
    await pool.query('DELETE FROM moods');
    await pool.query('DELETE FROM track_genres');
    await pool.query('DELETE FROM genres');
    await pool.query('DELETE FROM users');
    logger.info('Cleaned up existing records from related tables.');

    // 2. Seed Users
    const adminHash = await bcrypt.hash('adminpassword', 10);
    const producerHash = await bcrypt.hash('producerpassword', 10);
    const inactiveHash = await bcrypt.hash('blockedpassword', 10);

    await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)`,
      ['Admin User', 'admin@musicmarket.com', adminHash, 'admin', true]
    );
    await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)`,
      ['Producer User', 'producer@musicmarket.com', producerHash, 'producer', true]
    );
    await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)`,
      ['Blocked User', 'blocked@musicmarket.com', inactiveHash, 'producer', false]
    );
    logger.info('Seeded users table.');

    // 3. Seed Genres
    const genres = [
      { name: 'Cinematic', slug: 'cinematic' },
      { name: 'Hip Hop', slug: 'hip-hop' },
      { name: 'Lo-Fi', slug: 'lo-fi' },
      { name: 'Pop', slug: 'pop' },
      { name: 'Rock', slug: 'rock' }
    ];
    for (const genre of genres) {
      await pool.query(
        `INSERT INTO genres (genre_name, slug) VALUES ($1, $2)`,
        [genre.name, genre.slug]
      );
    }
    logger.info(`Seeded ${genres.length} genres.`);

    // 4. Seed Moods
    const moods = [
      { name: 'Angry', slug: 'angry' },
      { name: 'Dark', slug: 'dark' },
      { name: 'Energetic', slug: 'energetic' },
      { name: 'Happy', slug: 'happy' },
      { name: 'Sad', slug: 'sad' }
    ];
    for (const mood of moods) {
      await pool.query(
        `INSERT INTO moods (mood_name, slug) VALUES ($1, $2)`,
        [mood.name, mood.slug]
      );
    }
    logger.info(`Seeded ${moods.length} moods.`);

    // 5. Seed Tags
    const tags = [
      { name: 'synth', slug: 'synth' },
      { name: 'drums', slug: 'drums' },
      { name: 'vocal', slug: 'vocal' },
      { name: 'guitar', slug: 'guitar' },
      { name: 'bass', slug: 'bass' }
    ];
    for (const tag of tags) {
      await pool.query(
        `INSERT INTO tags (tag_name, slug) VALUES ($1, $2)`,
        [tag.name, tag.slug]
      );
    }
    logger.info(`Seeded ${tags.length} tags.`);

    // 6. Seed License Plans
    const licensePlans = [
      {
        name: 'Standard License',
        slug: 'standard-license',
        description: 'For personal demo, non-commercial use, social media upload.',
        rights: 'Non-exclusive usage rights, 10,000 streams limit.',
        is_exclusive: false,
        price: 500000.00,
        currency: 'VND',
        is_active: true
      },
      {
        name: 'Premium License',
        slug: 'premium-license',
        description: 'For commercial release, radio broadcast, streaming platforms.',
        rights: 'Non-exclusive usage rights, unlimited streams.',
        is_exclusive: false,
        price: 1500000.00,
        currency: 'VND',
        is_active: true
      },
      {
        name: 'Exclusive License',
        slug: 'exclusive-license',
        description: 'Full buyout of the track rights. Nobody else can buy it.',
        rights: 'Exclusive usage rights, transfer of ownership.',
        is_exclusive: true,
        price: 10000000.00,
        currency: 'VND',
        is_active: true
      },
      {
        name: 'Inactive License Plan',
        slug: 'inactive-license-plan',
        description: 'This is an inactive package for testing purposes.',
        rights: 'No rights granted.',
        is_exclusive: false,
        price: 200000.00,
        currency: 'VND',
        is_active: false
      }
    ];
    for (const plan of licensePlans) {
      await pool.query(
        `INSERT INTO license_plans (license_name, slug, description, usage_rights, is_exclusive, default_price, currency, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [plan.name, plan.slug, plan.description, plan.rights, plan.is_exclusive, plan.price, plan.currency, plan.is_active]
      );
    }
    logger.info(`Seeded ${licensePlans.length} license plans (including 1 inactive).`);

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Error seeding database:', error);
  } finally {
    await pool.end();
    logger.info('Database pool connection closed.');
    process.exit(0);
  }
};

seedDatabase();
