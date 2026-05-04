import { query } from "../config/database.js";

export const createVideosTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS videos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      album VARCHAR(255) NOT NULL,
      duration VARCHAR(50) NOT NULL,
      src VARCHAR(500) NOT NULL,
      thumbnail VARCHAR(500) NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  await query(sql);
};

export const getAllVideos = async () => {
  const sql = "SELECT * FROM videos ORDER BY created_at DESC";
  return await query(sql);
};

export const createVideo = async (videoData) => {
  const { title, album, duration, src, thumbnail, description } = videoData;
  const sql = "INSERT INTO videos (title, album, duration, src, thumbnail, description) VALUES (?, ?, ?, ?, ?, ?)";
  const result = await query(sql, [title, album, duration, src, thumbnail, description]);
  return result.insertId;
};

export const getVideoById = async (id) => {
  const sql = "SELECT * FROM videos WHERE id = ?";
  const results = await query(sql, [id]);
  return results[0];
};

export const updateVideo = async (id, videoData) => {
  const { title, album, duration, src, thumbnail, description } = videoData;
  const sql = `
    UPDATE videos 
    SET title = ?, album = ?, duration = ?, src = ?, thumbnail = ?, description = ?
    WHERE id = ?
  `;
  const result = await query(sql, [title, album, duration, src, thumbnail, description, id]);
  return result.affectedRows;
};

export const deleteVideo = async (id) => {
  const sql = "DELETE FROM videos WHERE id = ?";
  const result = await query(sql, [id]);
  return result.affectedRows;
};

export const getVideoCount = async () => {
  const sql = "SELECT COUNT(*) as count FROM videos";
  const results = await query(sql);
  return results[0].count;
};
