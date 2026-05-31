import pool from '../config/database.js';
import { checkOwnership } from './adminTrack.service.js';

const VALID_FILE_TYPES = ['preview', 'watermarked_preview', 'original', 'stem'];

/**
 * List audio files of a track
 */
export const listAudioFiles = async (trackId, user) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { user_id, role } = user;

  // 1. Verify access
  const access = await checkOwnership(parsedTrackId, user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  // 2. Query audio files
  const res = await pool.query(
    'SELECT audio_id, track_id, file_type, file_url, file_name, mime_type, file_size_bytes, is_public, is_downloadable, created_at FROM track_audio_files WHERE track_id = $1 ORDER BY created_at DESC',
    [parsedTrackId]
  );

  return { success: true, audioFiles: res.rows };
};

/**
 * Add audio file to track
 */
export const addAudioFile = async (trackId, user, data) => {
  const parsedTrackId = parseInt(trackId, 10);
  const { user_id, role } = user;

  // 1. Verify access
  const access = await checkOwnership(parsedTrackId, user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  const {
    file_type,
    file_url,
    file_name,
    mime_type,
    file_size_bytes,
    is_public = false,
    is_downloadable = false
  } = data;

  // 2. Validate inputs
  if (!file_type || !file_url) {
    return { invalidPayload: true, message: 'Thiếu trường file_type hoặc file_url.' };
  }

  if (!VALID_FILE_TYPES.includes(file_type)) {
    return { invalidFileType: true };
  }

  // Enforce privacy rule
  let targetPublic = is_public;
  if (file_type === 'original' || file_type === 'stem') {
    targetPublic = false;
  }

  // 3. Insert record
  const insertQuery = `
    INSERT INTO track_audio_files (
      track_id, file_type, file_url, file_name, mime_type, file_size_bytes, is_public, is_downloadable
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING audio_id, track_id, file_type, file_url, file_name, mime_type, file_size_bytes, is_public, is_downloadable, created_at
  `;

  const res = await pool.query(insertQuery, [
    parsedTrackId,
    file_type,
    file_url.trim(),
    file_name || null,
    mime_type || null,
    file_size_bytes ? parseInt(file_size_bytes, 10) : null,
    targetPublic,
    is_downloadable
  ]);

  return { success: true, audioFile: res.rows[0] };
};

/**
 * Update audio file metadata
 */
export const updateAudioFile = async (audioId, user, data) => {
  const parsedAudioId = parseInt(audioId, 10);
  const { user_id, role } = user;

  // 1. Lookup audio file to verify track ownership
  const findRes = await pool.query(
    'SELECT track_id, file_type, is_public FROM track_audio_files WHERE audio_id = $1',
    [parsedAudioId]
  );
  if (findRes.rows.length === 0) {
    return { notFound: true };
  }
  const { track_id: trackId, file_type: existingType } = findRes.rows[0];

  // 2. Verify track access
  const access = await checkOwnership(parseInt(trackId, 10), user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  const {
    file_type,
    file_url,
    file_name,
    mime_type,
    file_size_bytes,
    is_public,
    is_downloadable
  } = data;

  // Validate type if updating
  if (file_type && !VALID_FILE_TYPES.includes(file_type)) {
    return { invalidFileType: true };
  }

  // Determine final file type and public status after updates
  const finalType = file_type || existingType;
  let targetPublic = is_public !== undefined ? is_public : findRes.rows[0].is_public;
  if (finalType === 'original' || finalType === 'stem') {
    targetPublic = false;
  }

  // 3. Update record
  const updateQuery = `
    UPDATE track_audio_files
    SET
      file_type = COALESCE($1, file_type),
      file_url = COALESCE($2, file_url),
      file_name = COALESCE($3, file_name),
      mime_type = COALESCE($4, mime_type),
      file_size_bytes = COALESCE($5, file_size_bytes),
      is_public = $6,
      is_downloadable = COALESCE($7, is_downloadable)
    WHERE audio_id = $8
    RETURNING audio_id, track_id, file_type, file_url, file_name, mime_type, file_size_bytes, is_public, is_downloadable, created_at
  `;

  const res = await pool.query(updateQuery, [
    file_type || null,
    file_url ? file_url.trim() : null,
    file_name || null,
    mime_type || null,
    file_size_bytes ? parseInt(file_size_bytes, 10) : null,
    targetPublic,
    is_downloadable !== undefined ? is_downloadable : null,
    parsedAudioId
  ]);

  return { success: true, audioFile: res.rows[0] };
};

/**
 * Delete audio file
 */
export const deleteAudioFile = async (audioId, user) => {
  const parsedAudioId = parseInt(audioId, 10);
  const { user_id, role } = user;

  // 1. Lookup audio file to check ownership
  const findRes = await pool.query(
    'SELECT track_id FROM track_audio_files WHERE audio_id = $1',
    [parsedAudioId]
  );
  if (findRes.rows.length === 0) {
    return { notFound: true };
  }
  const trackId = findRes.rows[0].track_id;

  // 2. Verify track access
  const access = await checkOwnership(parseInt(trackId, 10), user_id, role);
  if (!access.exists) return { notFound: true };
  if (!access.allowed) return { forbidden: true };

  // 3. Delete
  await pool.query('DELETE FROM track_audio_files WHERE audio_id = $1', [parsedAudioId]);
  return { success: true };
};
export { VALID_FILE_TYPES };
