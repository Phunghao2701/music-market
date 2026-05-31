import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

// Dynamically locate and load the .env file relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5434', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20, // Số lượng kết nối tối đa trong pool
  idleTimeoutMillis: 30000, // Đóng các kết nối không dùng sau 30 giây
  connectionTimeoutMillis: 2000, // Trả về lỗi nếu kết nối quá 2 giây không được
});

// Kiểm tra kết nối khi khởi động server
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Kết nối tới PostgreSQL thất bại!', err);
  } else {
    logger.db(`Kết nối tới PostgreSQL thành công lúc: ${res.rows[0].now}`);
  }
});

export default pool;
export const query = (text, params) => pool.query(text, params);
