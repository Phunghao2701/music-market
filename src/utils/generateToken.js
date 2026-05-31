import jwt from 'jsonwebtoken';

/**
 * Generate a JWT Token for an authenticated user
 * @param {Object} user - User details to include in the payload
 * @param {string} user.user_id - Unique identifier of the user
 * @param {string} user.email - User email address
 * @param {string} user.role - User role (e.g., 'admin', 'producer')
 * @returns {string} Signed JWT token
 */
export const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_music_market_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn }
  );
};
