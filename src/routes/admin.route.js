import express from 'express';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { getPlayEvents } from '../controllers/play.controller.js';
import {
  getTracks,
  createTrack,
  getTrackById,
  updateTrack,
  updateStatus,
  publishTrack,
  deleteTrack
} from '../controllers/adminTrack.controller.js';
import {
  postGenre,
  putGenre,
  deleteGenre,
  postMood,
  putMood,
  deleteMood,
  postTag,
  putTag,
  deleteTag,
  putTrackGenres,
  putTrackMoods,
  putTrackTags
} from '../controllers/catalog.controller.js';

const router = express.Router();

// Role config helpers
const allowedAdminOnly = requireRole('admin');
const allowedManagers = requireRole('admin', 'producer');

// ==========================================
// PLAY EVENTS HISTORY
// ==========================================
router.get('/tracks/:trackId/play-events', verifyToken, requireRole('admin'), getPlayEvents);

// ==========================================
// TRACKS CRUD (Admin/Producer)
// ==========================================
router.get('/tracks', verifyToken, allowedManagers, getTracks);
router.post('/tracks', verifyToken, allowedManagers, createTrack);
router.get('/tracks/:trackId', verifyToken, allowedManagers, getTrackById);
router.put('/tracks/:trackId', verifyToken, allowedManagers, updateTrack);
router.patch('/tracks/:trackId/status', verifyToken, allowedManagers, updateStatus);
router.patch('/tracks/:trackId/publish', verifyToken, allowedManagers, publishTrack);
router.delete('/tracks/:trackId', verifyToken, allowedManagers, deleteTrack);

// ==========================================
// GLOBAL GENRES CRUD (Admin Only)
// ==========================================
router.post('/genres', verifyToken, allowedAdminOnly, postGenre);
router.put('/genres/:genreId', verifyToken, allowedAdminOnly, putGenre);
router.delete('/genres/:genreId', verifyToken, allowedAdminOnly, deleteGenre);

// ==========================================
// GLOBAL MOODS CRUD (Admin Only)
// ==========================================
router.post('/moods', verifyToken, allowedAdminOnly, postMood);
router.put('/moods/:moodId', verifyToken, allowedAdminOnly, putMood);
router.delete('/moods/:moodId', verifyToken, allowedAdminOnly, deleteMood);

// ==========================================
// GLOBAL TAGS CRUD (Admin Only)
// ==========================================
router.post('/tags', verifyToken, allowedAdminOnly, postTag);
router.put('/tags/:tagId', verifyToken, allowedAdminOnly, putTag);
router.delete('/tags/:tagId', verifyToken, allowedAdminOnly, deleteTag);

// ==========================================
// TRACK CATALOG ASSIGNMENTS (Admin/Producer)
// ==========================================
router.put('/tracks/:trackId/genres', verifyToken, allowedManagers, putTrackGenres);
router.put('/tracks/:trackId/moods', verifyToken, allowedManagers, putTrackMoods);
router.put('/tracks/:trackId/tags', verifyToken, allowedManagers, putTrackTags);

export default router;
