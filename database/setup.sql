-- MySQL Database Setup for tyy_portfolio
-- Run this script to create the database and tables

CREATE DATABASE IF NOT EXISTS tyy_portfolio;
USE tyy_portfolio;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Videos table
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
);

-- Insert default admin user
INSERT IGNORE INTO users (username, password) VALUES ('admin', 'admin123');

-- Insert sample videos
INSERT IGNORE INTO videos (title, album, duration, src, thumbnail, description) VALUES
('Web Development Workflow', 'Production', '12:45', '/videos/gojo.mp4', '/videos/thumnails/gojo-thumnail.png', 'Learn the best practices for modern web development'),
('អប្សរា', 'Short Films', '00:17', '/videos/apsara.mp4', '/videos/thumnails/absara-thumnail.png', 'A short cinematic music video');