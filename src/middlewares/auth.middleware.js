import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

/**
 * Middleware to verify JWT Token from Request Authorization header
 * Attaches decoded payload (user_id, email, role) to req.user
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('[Auth]: Verification failed: Missing or malformed Authorization header.');
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để thực hiện hành động này.'
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_music_market_2026';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Attach user payload to request object
    logger.info(`[Auth]: Verification successful for user: ${decoded.email}`);
    next();
  } catch (error) {
    logger.error('[Auth]: Verification failed: Token expired or invalid.', error);
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'
    });
  }
};
