import pool from '../config/database.js';
import { slugify } from '../utils/slugify.js';

// Helper to resolve genre, mood, and tag identifiers to their primary key IDs
const resolveGenreIds = async (genres) => {
  if (!genres || !Array.isArray(genres)) return [];
  const ids = [];
  for (const item of genres) {
    if (!isNaN(item)) {
      ids.push(parseInt(item, 10));
    } else {
      const res = await pool.query(
        'SELECT genre_id FROM genres WHERE slug = $1 OR genre_name = $1',
        [item.toString().trim()]
      );
      if (res.rows.length > 0) {
        ids.push(parseInt(res.rows[0].genre_id, 10));
      }
    }
  }
  return ids;
};

const resolveMoodIds = async (moods) => {
  if (!moods || !Array.isArray(moods)) return [];
  const ids = [];
  for (const item of moods) {
    if (!isNaN(item)) {
      ids.push(parseInt(item, 10));
    } else {
      const res = await pool.query(
        'SELECT mood_id FROM moods WHERE slug = $1 OR mood_name = $1',
        [item.toString().trim()]
      );
      if (res.rows.length > 0) {
        ids.push(parseInt(res.rows[0].mood_id, 10));
      }
    }
  }
  return ids;
};

const resolveTagIds = async (tags) => {
  if (!tags || !Array.isArray(tags)) return [];
  const ids = [];
  for (const item of tags) {
    if (!isNaN(item)) {
      ids.push(parseInt(item, 10));
    } else {
      const res = await pool.query(
        'SELECT tag_id FROM tags WHERE slug = $1 OR tag_name = $1',
        [item.toString().trim()]
      );
      if (res.rows.length > 0) {
        ids.push(parseInt(res.rows[0].tag_id, 10));
      }
    }
  }
  return ids;
};

// Helper check ownership of a track
const checkOwnership = async (trackId, userId, role) => {
  if (role === 'admin') return { exists: true, allowed: true };

  const res = await pool.query(
    'SELECT owner_id FROM tracks WHERE track_id = $1 AND deleted_at IS NULL',
    [trackId]
  );
  if (res.rows.length === 0) {
    return { exists: false, allowed: false };
  }
  const isOwner = res.rows[0].owner_id === userId;
  return { exists: true, allowed: isOwner };
};

/**
 * List tracks for admin/producer
 */
export const listTracks = async (user, options = {}) => {
  const { user_id, role } = user;
  const { page = 1, limit = 10 } = options;

  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.max(1, parseInt(limit, 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClauses = ['t.deleted_at IS NULL'];
  const params = [];

  if (role === 'producer') {
    params.push(user_id);
    whereClauses.push(`t.owner_id = $${params.length}`);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  // Count total
  const countQuery = `SELECT COUNT(*) FROM tracks t ${whereSql}`;
  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].count, 10);

  // List query with relations
  const listParams = [...params];
  listParams.push(parsedLimit);
  const limitIdx = listParams.length;
  listParams.push(offset);
  const offsetIdx = listParams.length;

  const listQuery = `
    SELECT 
      t.track_id,
      t.title,
      t.slug,
      t.bpm,
      t.musical_key,
      t.duration_seconds,
      t.status,
      t.is_featured,
      t.view_count,
      t.play_count,
      t.created_at,
      COALESCE((
        SELECT json_agg(json_build_object('genre_id', g.genre_id, 'genre_name', g.genre_name, 'slug', g.slug))
        FROM track_genres tg
        JOIN genres g ON tg.genre_id = g.genre_id
        WHERE tg.track_id = t.track_id
      ), '[]'::json) as genres,
      COALESCE((
        SELECT json_agg(json_build_object('mood_id', m.mood_id, 'mood_name', m.mood_name, 'slug', m.slug))
        FROM track_moods tm
        JOIN moods m ON tm.mood_id = m.mood_id
        WHERE tm.track_id = t.track_id
      ), '[]'::json) as moods,
      COALESCE((
        SELECT json_agg(json_build_object('tag_id', tag.tag_id, 'tag_name', tag.tag_name, 'slug', tag.slug))
        FROM track_tags tt
        JOIN tags tag ON tt.tag_id = tag.tag_id
        WHERE tt.track_id = t.track_id
      ), '[]'::json) as tags
    FROM tracks t
    ${whereSql}
    ORDER BY t.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const listRes = await pool.query(listQuery, listParams);

  return {
    tracks: listRes.rows,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit)
    }
  };
};

/**
 * Create track (Producer/Admin)
 */
export const createTrack = async (ownerId, data) => {
  const {
    title,
    slug,
    description,
    bpm,
    musical_key,
    duration_seconds,
    cover_image_url,
    preview_audio_url,
    allow_inquiry = true,
    genres = [],
    moods = [],
    tags = []
  } = data;

  if (!title) {
    throw new Error('Tiêu đề bài nhạc là bắt buộc.');
  }

  // 1. Resolve slug
  let targetSlug = slugify(slug || title);
  if (!targetSlug) {
    targetSlug = `track-${Date.now()}`;
  }

  // Check unique slug
  const slugCheck = await pool.query(
    'SELECT 1 FROM tracks WHERE slug = $1 AND deleted_at IS NULL',
    [targetSlug]
  );
  if (slugCheck.rows.length > 0) {
    return { slugExists: true };
  }

  // 2. Insert track
  const insertQuery = `
    INSERT INTO tracks (
      owner_id, title, slug, description, bpm, musical_key, duration_seconds, 
      cover_image_url, preview_audio_url, status, allow_inquiry
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', $10)
    RETURNING track_id, title, slug, description, bpm, musical_key, duration_seconds, cover_image_url, preview_audio_url, status, allow_inquiry, created_at
  `;

  const result = await pool.query(insertQuery, [
    ownerId,
    title,
    targetSlug,
    description || null,
    bpm ? parseInt(bpm, 10) : null,
    musical_key || null,
    duration_seconds ? parseInt(duration_seconds, 10) : null,
    cover_image_url || null,
    preview_audio_url || null,
    allow_inquiry
  ]);
  const newTrack = result.rows[0];
  const trackId = newTrack.track_id;

  // 3. Resolve and insert catalog relationships
  const genreIds = await resolveGenreIds(genres);
  for (const gId of genreIds) {
    await pool.query('INSERT INTO track_genres (track_id, genre_id) VALUES ($1, $2)', [trackId, gId]);
  }

  const moodIds = await resolveMoodIds(moods);
  for (const mId of moodIds) {
    await pool.query('INSERT INTO track_moods (track_id, mood_id) VALUES ($1, $2)', [trackId, mId]);
  }

  const tagIds = await resolveTagIds(tags);
  for (const tId of tagIds) {
    await pool.query('INSERT INTO track_tags (track_id, tag_id) VALUES ($1, $2)', [trackId, tId]);
  }

  // Return full populated track info
  return { success: true, track: await getTrackDetails(trackId) };
};

/**
 * Helper to fetch a single track details directly by ID
 */
const getTrackDetails = async (trackId) => {
  const query = `
    SELECT 
      t.track_id, t.owner_id, t.title, t.slug, t.description, t.bpm, t.musical_key, t.duration_seconds,
      t.cover_image_url, t.preview_audio_url, t.status, t.is_featured, t.allow_inquiry, t.view_count, t.play_count, t.created_at,
      COALESCE((
        SELECT json_agg(json_build_object('genre_id', g.genre_id, 'genre_name', g.genre_name, 'slug', g.slug))
        FROM track_genres tg
        JOIN genres g ON tg.genre_id = g.genre_id
        WHERE tg.track_id = t.track_id
      ), '[]'::json) as genres,
      COALESCE((
        SELECT json_agg(json_build_object('mood_id', m.mood_id, 'mood_name', m.mood_name, 'slug', m.slug))
        FROM track_moods tm
        JOIN moods m ON tm.mood_id = m.mood_id
        WHERE tm.track_id = t.track_id
      ), '[]'::json) as moods,
      COALESCE((
        SELECT json_agg(json_build_object('tag_id', tag.tag_id, 'tag_name', tag.tag_name, 'slug', tag.slug))
        FROM track_tags tt
        JOIN tags tag ON tt.tag_id = tag.tag_id
        WHERE tt.track_id = t.track_id
      ), '[]'::json) as tags
    FROM tracks t
    WHERE t.track_id = $1 AND t.deleted_at IS NULL
  `;
  const res = await pool.query(query, [trackId]);
  return res.rows[0] || null;
};

/**
 * Get track details in admin
 */
export const getTrackById = async (trackId, user) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { user_id, role } = user;

  const access = await checkOwnership(parsedTrackId, user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  const track = await getTrackDetails(parsedTrackId);
  return { success: true, track };
};

/**
 * Update track
 */
export const updateTrack = async (trackId, user, data) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { user_id, role } = user;

  // 1. Verify access
  const access = await checkOwnership(parsedTrackId, user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  const {
    title,
    slug,
    description,
    bpm,
    musical_key,
    duration_seconds,
    cover_image_url,
    preview_audio_url,
    allow_inquiry,
    genres,
    moods,
    tags
  } = data;

  // Check unique slug if provided
  if (slug) {
    const targetSlug = slugify(slug);
    const slugCheck = await pool.query(
      'SELECT 1 FROM tracks WHERE slug = $1 AND track_id <> $2 AND deleted_at IS NULL',
      [targetSlug, parsedTrackId]
    );
    if (slugCheck.rows.length > 0) {
      return { slugExists: true };
    }
  }

  // 2. Perform updates dynamically or directly
  const updateQuery = `
    UPDATE tracks
    SET 
      title = COALESCE($1, title),
      slug = COALESCE($2, slug),
      description = COALESCE($3, description),
      bpm = COALESCE($4, bpm),
      musical_key = COALESCE($5, musical_key),
      duration_seconds = COALESCE($6, duration_seconds),
      cover_image_url = COALESCE($7, cover_image_url),
      preview_audio_url = COALESCE($8, preview_audio_url),
      allow_inquiry = COALESCE($9, allow_inquiry)
    WHERE track_id = $10
  `;

  await pool.query(updateQuery, [
    title || null,
    slug ? slugify(slug) : null,
    description || null,
    bpm ? parseInt(bpm, 10) : null,
    musical_key || null,
    duration_seconds ? parseInt(duration_seconds, 10) : null,
    cover_image_url || null,
    preview_audio_url || null,
    allow_inquiry !== undefined ? allow_inquiry : null,
    parsedTrackId
  ]);

  // 3. Update relationships if provided
  if (genres && Array.isArray(genres)) {
    await pool.query('DELETE FROM track_genres WHERE track_id = $1', [parsedTrackId]);
    const genreIds = await resolveGenreIds(genres);
    for (const gId of genreIds) {
      await pool.query('INSERT INTO track_genres (track_id, genre_id) VALUES ($1, $2)', [parsedTrackId, gId]);
    }
  }

  if (moods && Array.isArray(moods)) {
    await pool.query('DELETE FROM track_moods WHERE track_id = $1', [parsedTrackId]);
    const moodIds = await resolveMoodIds(moods);
    for (const mId of moodIds) {
      await pool.query('INSERT INTO track_moods (track_id, mood_id) VALUES ($1, $2)', [parsedTrackId, mId]);
    }
  }

  if (tags && Array.isArray(tags)) {
    await pool.query('DELETE FROM track_tags WHERE track_id = $1', [parsedTrackId]);
    const tagIds = await resolveTagIds(tags);
    for (const tId of tagIds) {
      await pool.query('INSERT INTO track_tags (track_id, tag_id) VALUES ($1, $2)', [parsedTrackId, tId]);
    }
  }

  return { success: true, track: await getTrackDetails(parsedTrackId) };
};

/**
 * Update status
 */
export const updateTrackStatus = async (trackId, user, status) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { user_id, role } = user;

  // Verify access
  const access = await checkOwnership(parsedTrackId, user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  // Validate status enum
  const allowedStatuses = ['draft', 'published', 'reserved', 'sold_non_exclusive', 'sold_exclusive', 'hidden', 'archived'];
  if (!allowedStatuses.includes(status)) {
    return { invalidStatus: true };
  }

  const isPublished = status === 'published';
  const query = `
    UPDATE tracks
    SET 
      status = $1,
      published_at = CASE WHEN $2 = TRUE THEN NOW() ELSE published_at END
    WHERE track_id = $3
  `;
  await pool.query(query, [status, isPublished, parsedTrackId]);

  return { success: true, track: await getTrackDetails(parsedTrackId) };
};

/**
 * Publish track
 */
export const publishTrack = async (trackId, user) => {
  return updateTrackStatus(trackId, user, 'published');
};

/**
 * Soft delete track
 */
export const softDeleteTrack = async (trackId, user) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { user_id, role } = user;

  // Verify access
  const access = await checkOwnership(parsedTrackId, user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  await pool.query(
    'UPDATE tracks SET deleted_at = NOW() WHERE track_id = $1',
    [parsedTrackId]
  );

  return { success: true };
};
export { checkOwnership };
