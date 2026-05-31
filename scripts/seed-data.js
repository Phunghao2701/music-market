import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';
import logger from '../src/utils/logger.js';

const seedDatabase = async () => {
  try {
    logger.info('Starting full database seeding (users, genres, moods, tags, license plans, and tracks)...');

    // 1. Clear existing table records
    await pool.query('DELETE FROM track_play_events');
    await pool.query('DELETE FROM purchases');
    await pool.query('DELETE FROM inquiry_tracks');
    await pool.query('DELETE FROM purchase_inquiries');
    await pool.query('DELETE FROM customers');
    await pool.query('DELETE FROM track_audio_files');
    await pool.query('DELETE FROM track_license_options');
    await pool.query('DELETE FROM license_plans');
    await pool.query('DELETE FROM track_tags');
    await pool.query('DELETE FROM tags');
    await pool.query('DELETE FROM track_moods');
    await pool.query('DELETE FROM moods');
    await pool.query('DELETE FROM track_genres');
    await pool.query('DELETE FROM genres');
    await pool.query('DELETE FROM tracks');
    await pool.query('DELETE FROM users');
    logger.info('Cleaned up existing records from related tables.');

    // 2. Seed Users
    const adminHash = await bcrypt.hash('adminpassword', 10);
    const producerHash = await bcrypt.hash('producerpassword', 10);
    const inactiveHash = await bcrypt.hash('blockedpassword', 10);

    const adminUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING user_id`,
      ['Admin User', 'admin@musicmarket.com', adminHash, 'admin', true]
    );
    const producerUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING user_id`,
      ['Producer User', 'producer@musicmarket.com', producerHash, 'producer', true]
    );
    await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)`,
      ['Blocked User', 'blocked@musicmarket.com', inactiveHash, 'producer', false]
    );
    const producerId = producerUser.rows[0].user_id;
    logger.info('Seeded users table.');

    // 3. Seed Genres
    const genres = [
      { name: 'Cinematic', slug: 'cinematic' },
      { name: 'Hip Hop', slug: 'hip-hop' },
      { name: 'Lo-Fi', slug: 'lo-fi' },
      { name: 'Pop', slug: 'pop' },
      { name: 'Rock', slug: 'rock' }
    ];
    const genreMap = {};
    for (const genre of genres) {
      const res = await pool.query(
        `INSERT INTO genres (genre_name, slug) VALUES ($1, $2) RETURNING genre_id`,
        [genre.name, genre.slug]
      );
      genreMap[genre.slug] = res.rows[0].genre_id;
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
    const moodMap = {};
    for (const mood of moods) {
      const res = await pool.query(
        `INSERT INTO moods (mood_name, slug) VALUES ($1, $2) RETURNING mood_id`,
        [mood.name, mood.slug]
      );
      moodMap[mood.slug] = res.rows[0].mood_id;
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
    const tagMap = {};
    for (const tag of tags) {
      const res = await pool.query(
        `INSERT INTO tags (tag_name, slug) VALUES ($1, $2) RETURNING tag_id`,
        [tag.name, tag.slug]
      );
      tagMap[tag.slug] = res.rows[0].tag_id;
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
    logger.info(`Seeded ${licensePlans.length} license plans.`);

    // 7. Seed Tracks
    const tracksToSeed = [
      {
        title: 'Chill Lofi Beats',
        slug: 'chill-lofi-beats',
        description: 'Smooth relaxing lo-fi vibes for studying and focus.',
        bpm: 80,
        musical_key: 'C Minor',
        duration_seconds: 180,
        status: 'published',
        is_featured: true,
        genres: ['lo-fi', 'hip-hop'],
        moods: ['happy', 'sad'],
        tags: ['synth', 'drums']
      },
      {
        title: 'Cinematic Dark Ambient',
        slug: 'cinematic-dark-ambient',
        description: 'Dreadful and eerie background score for horror games or films.',
        bpm: 65,
        musical_key: 'A Minor',
        duration_seconds: 240,
        status: 'published',
        is_featured: true,
        genres: ['cinematic'],
        moods: ['dark', 'sad'],
        tags: ['synth', 'bass']
      },
      {
        title: 'Energetic Rock Anthem',
        slug: 'energetic-rock-anthem',
        description: 'Heavy guitar riffs and loud drums for sports videos.',
        bpm: 140,
        musical_key: 'G Major',
        duration_seconds: 210,
        status: 'published',
        is_featured: false,
        genres: ['rock'],
        moods: ['energetic'],
        tags: ['guitar', 'drums', 'bass']
      },
      {
        title: 'Pop Summer Breeze',
        slug: 'pop-summer-breeze',
        description: 'Upbeat bright pop song with catchy vocal hooks.',
        bpm: 115,
        musical_key: 'F Major',
        duration_seconds: 195,
        status: 'published',
        is_featured: false,
        genres: ['pop'],
        moods: ['happy', 'energetic'],
        tags: ['vocal', 'synth', 'drums']
      },
      {
        title: 'Hip Hop Street Vibes',
        slug: 'hip-hop-street-vibes',
        description: 'Hard-hitting underground boom-bap hip-hop beats.',
        bpm: 90,
        musical_key: 'D Minor',
        duration_seconds: 170,
        status: 'published',
        is_featured: false,
        genres: ['hip-hop'],
        moods: ['dark', 'energetic'],
        tags: ['drums', 'bass']
      },
      {
        title: 'Unpublished Draft Track',
        slug: 'unpublished-draft-track',
        description: 'This is a draft that should NOT be visible publicly.',
        bpm: 100,
        musical_key: 'C Major',
        duration_seconds: 150,
        status: 'draft',
        is_featured: false,
        genres: ['pop'],
        moods: ['happy'],
        tags: ['vocal']
      },
      {
        title: 'Deleted Lofi Track',
        slug: 'deleted-lofi-track',
        description: 'This track was soft deleted and should NOT be visible.',
        bpm: 75,
        musical_key: 'F Minor',
        duration_seconds: 160,
        status: 'published',
        is_featured: false,
        deleted_at: new Date(),
        genres: ['lo-fi'],
        moods: ['sad'],
        tags: ['synth']
      }
    ];

    for (const trackData of tracksToSeed) {
      const trackRes = await pool.query(
        `INSERT INTO tracks (owner_id, title, slug, description, bpm, musical_key, duration_seconds, status, is_featured, published_at, deleted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING track_id`,
        [
          producerId,
          trackData.title,
          trackData.slug,
          trackData.description,
          trackData.bpm,
          trackData.musical_key,
          trackData.duration_seconds,
          trackData.status,
          trackData.is_featured,
          trackData.status === 'published' ? new Date() : null,
          trackData.deleted_at || null
        ]
      );
      const trackId = trackRes.rows[0].track_id;

      // Seed Genres Association
      for (const genreSlug of trackData.genres) {
        const genreId = genreMap[genreSlug];
        if (genreId) {
          await pool.query(
            `INSERT INTO track_genres (track_id, genre_id) VALUES ($1, $2)`,
            [trackId, genreId]
          );
        }
      }

      // Seed Moods Association
      for (const moodSlug of trackData.moods) {
        const moodId = moodMap[moodSlug];
        if (moodId) {
          await pool.query(
            `INSERT INTO track_moods (track_id, mood_id) VALUES ($1, $2)`,
            [trackId, moodId]
          );
        }
      }

      // Seed Tags Association
      for (const tagSlug of trackData.tags) {
        const tagId = tagMap[tagSlug];
        if (tagId) {
          await pool.query(
            `INSERT INTO track_tags (track_id, tag_id) VALUES ($1, $2)`,
            [trackId, tagId]
          );
        }
      }
    }
    logger.info(`Seeded ${tracksToSeed.length} tracks and their relation mappings.`);

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
