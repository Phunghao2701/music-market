import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { generateToken } from '../utils/generateToken.js';

/**
 * Custom operational error utility for auth service
 */
const buildAuthError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Handle authentication login with email and password
 * @param {Object} credentials - Email and Password credentials
 * @returns {Promise<Object>} Object containing the token and user profile
 */
export const loginWithEmailPassword = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const query = `
    SELECT 
      user_id, 
      username, 
      email, 
      password_hash, 
      role, 
      avatar_url, 
      is_active
    FROM users
    WHERE LOWER(email) = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [normalizedEmail]);
  const user = result.rows[0];

  if (!user) {
    throw buildAuthError('Email hoặc mật khẩu không đúng', 401);
  }

  if (!user.is_active) {
    throw buildAuthError('Tài khoản đã bị vô hiệu hóa', 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw buildAuthError('Email hoặc mật khẩu không đúng', 401);
  }

  // Generate JWT access token
  const token = generateToken(user);

  return {
    token,
    user: {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      is_active: user.is_active
    }
  };
};

/**
 * Fetch fresh user details from the database by user ID
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object>} Fresh user profile details
 */
export const getUserById = async (userId) => {
  const query = `
    SELECT 
      user_id, 
      username, 
      email, 
      role, 
      avatar_url, 
      is_active,
      created_at,
      updated_at
    FROM users
    WHERE user_id = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [userId]);
  const user = result.rows[0];

  if (!user) {
    throw buildAuthError('Tài khoản không tồn tại', 404);
  }

  if (!user.is_active) {
    throw buildAuthError('Tài khoản đã bị vô hiệu hóa', 403);
  }

  return {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar_url: user.avatar_url,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
};
