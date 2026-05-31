import pool from '../config/database.js';
import { slugify } from '../utils/slugify.js';
import { checkOwnership } from './adminTrack.service.js';

// ==========================================
// GENRES CATALOG SERVICES
// ==========================================

export const createGenre = async (data) => {
  const { genre_name, slug } = data;
  if (!genre_name) {
    throw new Error('Tên thể loại là bắt buộc.');
  }

  let targetSlug = slugify(slug || genre_name);
  const slugCheck = await pool.query('SELECT 1 FROM genres WHERE slug = $1', [targetSlug]);
  if (slugCheck.rows.length > 0) {
    return { slugExists: true };
  }

  const res = await pool.query(
    'INSERT INTO genres (genre_name, slug) VALUES ($1, $2) RETURNING genre_id, genre_name, slug, created_at',
    [genre_name.trim(), targetSlug]
  );
  return { success: true, genre: res.rows[0] };
};

export const updateGenre = async (genreId, data) => {
  const parsedId = parseInt(genreId, 10);
  const { genre_name, slug } = data;

  const existsRes = await pool.query('SELECT 1 FROM genres WHERE genre_id = $1', [parsedId]);
  if (existsRes.rows.length === 0) {
    return { notFound: true };
  }

  let targetSlug = slug ? slugify(slug) : null;
  if (targetSlug) {
    const slugCheck = await pool.query(
      'SELECT 1 FROM genres WHERE slug = $1 AND genre_id <> $2',
      [targetSlug, parsedId]
    );
    if (slugCheck.rows.length > 0) {
      return { slugExists: true };
    }
  }

  const query = `
    UPDATE genres
    SET 
      genre_name = COALESCE($1, genre_name),
      slug = COALESCE($2, slug)
    WHERE genre_id = $3
    RETURNING genre_id, genre_name, slug, created_at
  `;
  const res = await pool.query(query, [genre_name ? genre_name.trim() : null, targetSlug, parsedId]);
  return { success: true, genre: res.rows[0] };
};

export const deleteGenre = async (genreId) => {
  const parsedId = parseInt(genreId, 10);
  const existsRes = await pool.query('SELECT 1 FROM genres WHERE genre_id = $1', [parsedId]);
  if (existsRes.rows.length === 0) {
    return { notFound: true };
  }

  await pool.query('DELETE FROM genres WHERE genre_id = $1', [parsedId]);
  return { success: true };
};

// ==========================================
// MOODS CATALOG SERVICES
// ==========================================

export const createMood = async (data) => {
  const { mood_name, slug } = data;
  if (!mood_name) {
    throw new Error('Tên cảm xúc là bắt buộc.');
  }

  let targetSlug = slugify(slug || mood_name);
  const slugCheck = await pool.query('SELECT 1 FROM moods WHERE slug = $1', [targetSlug]);
  if (slugCheck.rows.length > 0) {
    return { slugExists: true };
  }

  const res = await pool.query(
    'INSERT INTO moods (mood_name, slug) VALUES ($1, $2) RETURNING mood_id, mood_name, slug, created_at',
    [mood_name.trim(), targetSlug]
  );
  return { success: true, mood: res.rows[0] };
};

export const updateMood = async (moodId, data) => {
  const parsedId = parseInt(moodId, 10);
  const { mood_name, slug } = data;

  const existsRes = await pool.query('SELECT 1 FROM moods WHERE mood_id = $1', [parsedId]);
  if (existsRes.rows.length === 0) {
    return { notFound: true };
  }

  let targetSlug = slug ? slugify(slug) : null;
  if (targetSlug) {
    const slugCheck = await pool.query(
      'SELECT 1 FROM moods WHERE slug = $1 AND mood_id <> $2',
      [targetSlug, parsedId]
    );
    if (slugCheck.rows.length > 0) {
      return { slugExists: true };
    }
  }

  const query = `
    UPDATE moods
    SET 
      mood_name = COALESCE($1, mood_name),
      slug = COALESCE($2, slug)
    WHERE mood_id = $3
    RETURNING mood_id, mood_name, slug, created_at
  `;
  const res = await pool.query(query, [mood_name ? mood_name.trim() : null, targetSlug, parsedId]);
  return { success: true, mood: res.rows[0] };
};

export const deleteMood = async (moodId) => {
  const parsedId = parseInt(moodId, 10);
  const existsRes = await pool.query('SELECT 1 FROM moods WHERE mood_id = $1', [parsedId]);
  if (existsRes.rows.length === 0) {
    return { notFound: true };
  }

  await pool.query('DELETE FROM moods WHERE mood_id = $1', [parsedId]);
  return { success: true };
};

// ==========================================
// TAGS CATALOG SERVICES
// ==========================================

export const createTag = async (data) => {
  const { tag_name, slug } = data;
  if (!tag_name) {
    throw new Error('Tên từ khóa là bắt buộc.');
  }

  let targetSlug = slugify(slug || tag_name);
  const slugCheck = await pool.query('SELECT 1 FROM tags WHERE slug = $1', [targetSlug]);
  if (slugCheck.rows.length > 0) {
    return { slugExists: true };
  }

  const res = await pool.query(
    'INSERT INTO tags (tag_name, slug) VALUES ($1, $2) RETURNING tag_id, tag_name, slug, created_at',
    [tag_name.trim(), targetSlug]
  );
  return { success: true, tag: res.rows[0] };
};

export const updateTag = async (tagId, data) => {
  const parsedId = parseInt(tagId, 10);
  const { tag_name, slug } = data;

  const existsRes = await pool.query('SELECT 1 FROM tags WHERE tag_id = $1', [parsedId]);
  if (existsRes.rows.length === 0) {
    return { notFound: true };
  }

  let targetSlug = slug ? slugify(slug) : null;
  if (targetSlug) {
    const slugCheck = await pool.query(
      'SELECT 1 FROM tags WHERE slug = $1 AND tag_id <> $2',
      [targetSlug, parsedId]
    );
    if (slugCheck.rows.length > 0) {
      return { slugExists: true };
    }
  }

  const query = `
    UPDATE tags
    SET 
      tag_name = COALESCE($1, tag_name),
      slug = COALESCE($2, slug)
    WHERE tag_id = $3
    RETURNING tag_id, tag_name, slug, created_at
  `;
  const res = await pool.query(query, [tag_name ? tag_name.trim() : null, targetSlug, parsedId]);
  return { success: true, tag: res.rows[0] };
};

export const deleteTag = async (tagId) => {
  const parsedId = parseInt(tagId, 10);
  const existsRes = await pool.query('SELECT 1 FROM tags WHERE tag_id = $1', [parsedId]);
  if (existsRes.rows.length === 0) {
    return { notFound: true };
  }

  await pool.query('DELETE FROM tags WHERE tag_id = $1', [parsedId]);
  return { success: true };
};

// ==========================================
// TRACK RELATION ASSIGNMENTS
// ==========================================

export const assignGenresToTrack = async (trackId, user, genreIds) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { user_id, role } = user;

  // 1. Verify track access
  const access = await checkOwnership(parsedTrackId, user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  // 2. Validate genre IDs
  if (!genreIds || !Array.isArray(genreIds)) {
    return { invalidPayload: true };
  }

  if (genreIds.length > 0) {
    const checkRes = await pool.query(
      'SELECT COUNT(*) FROM genres WHERE genre_id = ANY($1::bigint[])',
      [genreIds]
    );
    const validCount = parseInt(checkRes.rows[0].count, 10);
    if (validCount !== genreIds.length) {
      return { invalidCatalogIds: true };
    }
  }

  // 3. Sync mappings
  await pool.query('DELETE FROM track_genres WHERE track_id = $1', [parsedTrackId]);
  for (const gId of genreIds) {
    await pool.query('INSERT INTO track_genres (track_id, genre_id) VALUES ($1, $2)', [parsedTrackId, gId]);
  }

  return { success: true };
};

export const assignMoodsToTrack = async (trackId, user, moodIds) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { user_id, role } = user;

  // 1. Verify track access
  const access = await checkOwnership(parsedTrackId, user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  // 2. Validate mood IDs
  if (!moodIds || !Array.isArray(moodIds)) {
    return { invalidPayload: true };
  }

  if (moodIds.length > 0) {
    const checkRes = await pool.query(
      'SELECT COUNT(*) FROM moods WHERE mood_id = ANY($1::bigint[])',
      [moodIds]
    );
    const validCount = parseInt(checkRes.rows[0].count, 10);
    if (validCount !== moodIds.length) {
      return { invalidCatalogIds: true };
    }
  }

  // 3. Sync mappings
  await pool.query('DELETE FROM track_moods WHERE track_id = $1', [parsedTrackId]);
  for (const mId of moodIds) {
    await pool.query('INSERT INTO track_moods (track_id, mood_id) VALUES ($1, $2)', [parsedTrackId, mId]);
  }

  return { success: true };
};

export const assignTagsToTrack = async (trackId, user, tagIds) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { user_id, role } = user;

  // 1. Verify track access
  const access = await checkOwnership(parsedTrackId, user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  // 2. Validate tag IDs
  if (!tagIds || !Array.isArray(tagIds)) {
    return { invalidPayload: true };
  }

  if (tagIds.length > 0) {
    const checkRes = await pool.query(
      'SELECT COUNT(*) FROM tags WHERE tag_id = ANY($1::bigint[])',
      [tagIds]
    );
    const validCount = parseInt(checkRes.rows[0].count, 10);
    if (validCount !== tagIds.length) {
      return { invalidCatalogIds: true };
    }
  }

  // 3. Sync mappings
  await pool.query('DELETE FROM track_tags WHERE track_id = $1', [parsedTrackId]);
  for (const tId of tagIds) {
    await pool.query('INSERT INTO track_tags (track_id, tag_id) VALUES ($1, $2)', [parsedTrackId, tId]);
  }

  return { success: true };
};
