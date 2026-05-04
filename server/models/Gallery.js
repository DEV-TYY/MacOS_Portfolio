import { query } from "../config/database.js";

export const createGalleryTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS gallery_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      img VARCHAR(500) NOT NULL,
      title VARCHAR(255) NOT NULL DEFAULT 'Gallery image',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  await query(sql);
};

export const getAllGalleryImages = async () => {
  const sql = "SELECT * FROM gallery_images ORDER BY created_at DESC";
  return await query(sql);
};

export const createGalleryImage = async ({ img, title = "Gallery image" }) => {
  const sql = "INSERT INTO gallery_images (img, title) VALUES (?, ?)";
  const result = await query(sql, [img, title]);
  return result.insertId;
};

export const getGalleryImageById = async (id) => {
  const sql = "SELECT * FROM gallery_images WHERE id = ?";
  const results = await query(sql, [id]);
  return results[0];
};

export const updateGalleryImage = async (id, { img, title }) => {
  const sql = "UPDATE gallery_images SET img = ?, title = ? WHERE id = ?";
  const result = await query(sql, [img, title, id]);
  return result.affectedRows;
};

export const deleteGalleryImage = async (id) => {
  const sql = "DELETE FROM gallery_images WHERE id = ?";
  const result = await query(sql, [id]);
  return result.affectedRows;
};

export const getGalleryCount = async () => {
  const sql = "SELECT COUNT(*) as count FROM gallery_images";
  const results = await query(sql);
  return results[0].count;
};
