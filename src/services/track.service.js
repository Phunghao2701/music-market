import pool from '../config/database.js';

/**
 * Fetch all published tracks matching criteria with optional pagination
 */
export const getPublishedTracks = async (filters = {}) => {
  const {
    genre,
    mood,
    tag,
    bpm_min,
    bpm_max,
    musical_key,
    search,
    page = 1,
    limit = 10
  } = filters;

  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.max(1, parseInt(limit, 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const whereClauses = [`t.status = 'published'`, `t.deleted_at IS NULL`];
  const params = [];

  if (genre) {
    params.push(genre.trim());
    whereClauses.push(`EXISTS (
      SELECT 1 FROM track_genres tg 
      JOIN genres g ON tg.genre_id = g.genre_id 
      WHERE tg.track_id = t.track_id AND (g.slug = $${params.length} OR g.genre_name = $${params.length} OR g.genre_id::text = $${params.length})
    )`);
  }

  if (mood) {
    params.push(mood.trim());
    whereClauses.push(`EXISTS (
      SELECT 1 FROM track_moods tm 
      JOIN moods m ON tm.mood_id = m.mood_id 
      WHERE tm.track_id = t.track_id AND (m.slug = $${params.length} OR m.mood_name = $${params.length} OR m.mood_id::text = $${params.length})
    )`);
  }

  if (tag) {
    params.push(tag.trim());
    whereClauses.push(`EXISTS (
      SELECT 1 FROM track_tags tt 
      JOIN tags tg ON tt.tag_id = tg.tag_id 
      WHERE tt.track_id = t.track_id AND (tg.slug = $${params.length} OR tg.tag_name = $${params.length} OR tg.tag_id::text = $${params.length})
    )`);
  }

  if (bpm_min !== undefined && bpm_min !== null && bpm_min !== '') {
    params.push(parseInt(bpm_min, 10));
    whereClauses.push(`t.bpm >= $${params.length}`);
  }

  if (bpm_max !== undefined && bpm_max !== null && bpm_max !== '') {
    params.push(parseInt(bpm_max, 10));
    whereClauses.push(`t.bpm <= $${params.length}`);
  }

  if (musical_key) {
    params.push(musical_key.trim());
    whereClauses.push(`t.musical_key = $${params.length}`);
  }

  if (search) {
    params.push(`%${search.trim().toLowerCase()}%`);
    whereClauses.push(`LOWER(t.title) LIKE $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // 1. Get total count
  const countQuery = `SELECT COUNT(*) FROM tracks t ${whereSql}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count, 10);

  // 2. Get tracks list with populated nested fields
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
      t.description,
      t.bpm,
      t.musical_key,
      t.duration_seconds,
      t.cover_image_url,
      t.preview_audio_url,
      t.is_featured,
      t.allow_inquiry,
      t.view_count,
      t.play_count,
      t.inquiry_count,
      t.published_at,
      t.created_at,
      t.updated_at,
      (
        SELECT json_build_object('user_id', u.user_id, 'username', u.username, 'avatar_url', u.avatar_url) 
        FROM users u 
        WHERE u.user_id = t.owner_id
      ) as owner,
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
    ORDER BY t.published_at DESC, t.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const listResult = await pool.query(listQuery, listParams);

  return {
    tracks: listResult.rows,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit)
    }
  };
};

/**
 * Fetch a single published track by its slug and increment its view count atomically
 */
export const getTrackBySlug = async (slug) => {
  // 1. Increment view count
  const updateQuery = `
    UPDATE tracks
    SET view_count = view_count + 1
    WHERE slug = $1 AND status = 'published' AND deleted_at IS NULL
    RETURNING track_id
  `;
  const updateResult = await pool.query(updateQuery, [slug]);

  if (updateResult.rows.length === 0) {
    return null;
  }

  // 2. Fetch track with full populated details
  const detailQuery = `
    SELECT 
      t.track_id,
      t.title,
      t.slug,
      t.description,
      t.bpm,
      t.musical_key,
      t.duration_seconds,
      t.cover_image_url,
      t.preview_audio_url,
      t.is_featured,
      t.allow_inquiry,
      t.view_count,
      t.play_count,
      t.inquiry_count,
      t.published_at,
      t.created_at,
      t.updated_at,
      (
        SELECT json_build_object('user_id', u.user_id, 'username', u.username, 'avatar_url', u.avatar_url) 
        FROM users u 
        WHERE u.user_id = t.owner_id
      ) as owner,
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
    WHERE t.slug = $1 AND t.status = 'published' AND t.deleted_at IS NULL
    LIMIT 1
  `;

  const result = await pool.query(detailQuery, [slug]);
  return result.rows[0] || null;
};

/**
 * Fetch featured tracks
 */
export const getFeaturedTracks = async (limit = 10) => {
  const parsedLimit = Math.max(1, parseInt(limit, 10));

  const query = `
    SELECT 
      t.track_id,
      t.title,
      t.slug,
      t.description,
      t.bpm,
      t.musical_key,
      t.duration_seconds,
      t.cover_image_url,
      t.preview_audio_url,
      t.is_featured,
      t.allow_inquiry,
      t.view_count,
      t.play_count,
      t.inquiry_count,
      t.published_at,
      t.created_at,
      t.updated_at,
      (
        SELECT json_build_object('user_id', u.user_id, 'username', u.username, 'avatar_url', u.avatar_url) 
        FROM users u 
        WHERE u.user_id = t.owner_id
      ) as owner,
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
    WHERE t.is_featured = TRUE AND t.status = 'published' AND t.deleted_at IS NULL
    ORDER BY t.published_at DESC, t.created_at DESC
    LIMIT $1
  `;

  const result = await pool.query(query, [parsedLimit]);
  return result.rows;
};

/**
 * Fetch related tracks sharing genres, moods, or tags (ordered by overlap strength)
 */
export const getRelatedTracks = async (trackId, limit = 5) => {
  const parsedTrackId = parseInt(trackId, 10);
  const parsedLimit = Math.max(1, parseInt(limit, 10));

  // Verify track exists and is published
  const existsRes = await pool.query(
    `SELECT 1 FROM tracks WHERE track_id = $1 AND status = 'published' AND deleted_at IS NULL`,
    [parsedTrackId]
  );
  if (existsRes.rows.length === 0) {
    return [];
  }

  const query = `
    SELECT 
      t.track_id,
      t.title,
      t.slug,
      t.description,
      t.bpm,
      t.musical_key,
      t.duration_seconds,
      t.cover_image_url,
      t.preview_audio_url,
      t.is_featured,
      t.allow_inquiry,
      t.view_count,
      t.play_count,
      t.inquiry_count,
      t.published_at,
      t.created_at,
      t.updated_at,
      (
        SELECT json_build_object('user_id', u.user_id, 'username', u.username, 'avatar_url', u.avatar_url) 
        FROM users u 
        WHERE u.user_id = t.owner_id
      ) as owner,
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
      ), '[]'::json) as tags,
      (
        COALESCE((SELECT COUNT(*) FROM track_genres WHERE track_id = t.track_id AND genre_id IN (SELECT genre_id FROM track_genres WHERE track_id = $1)), 0) +
        COALESCE((SELECT COUNT(*) FROM track_moods WHERE track_id = t.track_id AND mood_id IN (SELECT mood_id FROM track_moods WHERE track_id = $1)), 0) +
        COALESCE((SELECT COUNT(*) FROM track_tags WHERE track_id = t.track_id AND tag_id IN (SELECT tag_id FROM track_tags WHERE track_id = $1)), 0)
      ) as score
    FROM tracks t
    WHERE t.track_id <> $1 AND t.status = 'published' AND t.deleted_at IS NULL
    GROUP BY t.track_id
    HAVING (
      COALESCE((SELECT COUNT(*) FROM track_genres WHERE track_id = t.track_id AND genre_id IN (SELECT genre_id FROM track_genres WHERE track_id = $1)), 0) +
      COALESCE((SELECT COUNT(*) FROM track_moods WHERE track_id = t.track_id AND mood_id IN (SELECT mood_id FROM track_moods WHERE track_id = $1)), 0) +
      COALESCE((SELECT COUNT(*) FROM track_tags WHERE track_id = t.track_id AND tag_id IN (SELECT tag_id FROM track_tags WHERE track_id = $1)), 0)
    ) > 0
    ORDER BY score DESC, t.published_at DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [parsedTrackId, parsedLimit]);
  return result.rows;
};
