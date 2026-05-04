import { query } from "../config/database.js";

export const createUsersTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  await query(sql);
};

export const findUserByCredentials = async (username, password) => {
  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
  const results = await query(sql, [username, password]);
  return results[0];
};

export const createUser = async (username, password) => {
  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
  const result = await query(sql, [username, password]);
  return result.insertId;
};

export const getUserCount = async () => {
  const sql = "SELECT COUNT(*) as count FROM users";
  const results = await query(sql);
  return results[0].count;
};
