-- ==========================================================
-- CAMPUS CARE - Lost & Found Portal Database Schema
-- MySQL Schema for College CEP Project
-- ==========================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS campus_care_db;
USE campus_care_db;

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  branch VARCHAR(100) DEFAULT NULL,
  year VARCHAR(50) DEFAULT NULL,
  role VARCHAR(50) DEFAULT 'Student',
  phone VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create Items Table
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  type ENUM('Lost', 'Found') NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  date VARCHAR(50) NOT NULL,
  image LONGTEXT,
  status VARCHAR(50) DEFAULT 'Reported',
  reporter_name VARCHAR(255) DEFAULT NULL,
  reporter_email VARCHAR(255) DEFAULT NULL,
  reporter_phone VARCHAR(50) DEFAULT NULL,
  reporter_role VARCHAR(50) DEFAULT 'Student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Initial Sample Seed Data (For Testing & College Demo)
-- ==========================================================

-- Insert Default Demo Users (Passwords hashed or plain fallback 'password123')
INSERT INTO users (id, name, email, password, branch, year, role, phone)
VALUES 
(1, 'Alex Johnson', 'alex.j@campus.edu', '$2a$10$7Z2.N8Hov5tqK9rGg4F4E.0b9V7zJ9h8X3Z3rP5m5qW6e8g9h0i1.', 'Computer Science', '3rd Year', 'Student', '+1 (555) 234-5678'),
(2, 'Dr. Sarah Watson', 's.watson@campus.edu', '$2a$10$7Z2.N8Hov5tqK9rGg4F4E.0b9V7zJ9h8X3Z3rP5m5qW6e8g9h0i1.', 'Mathematics', 'Faculty', 'Faculty', '+1 (555) 567-8901'),
(3, 'Chief Security Officer Miller', 'admin@college.edu', '$2a$10$7Z2.N8Hov5tqK9rGg4F4E.0b9V7zJ9h8X3Z3rP5m5qW6e8g9h0i1.', 'Campus Security', 'Staff', 'Admin', '+1 (555) 019-9000')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Realistic Sample Campus Items
INSERT INTO items (id, user_id, type, item_name, description, category, location, date, image, status, reporter_name, reporter_email, reporter_phone, reporter_role)
VALUES
(1, 1, 'Lost', 'MacBook Air M2 (Space Gray)', '13-inch Space Gray MacBook Air in a dark navy Tomtoc sleeve. Has a GitHub octocat sticker and an ACM student chapter sticker on the top corner.', 'Electronics', 'Central Library 2nd Floor', '2026-09-10', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 'Verified', 'Alex Johnson', 'alex.j@campus.edu', '+1 (555) 234-5678', 'Student'),

(2, NULL, 'Found', 'Navy Blue Hydro Flask (32oz)', 'Dark blue wide-mouth Hydro Flask with a flex cap. Has a minor dent on the bottom rim and a sticker reading "Outdoor Adventure Club". Found after the morning football practice.', 'Others', 'Football Ground Bleachers', '2026-09-11', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80', 'Reported', 'Coach Marcus Bell', 'm.bell@campus.edu', '+1 (555) 345-6789', 'Staff'),

(3, NULL, 'Found', 'College Student ID Card – Alex Sharma', 'Official student ID card for Alex Sharma, Dept. of Computer Science & Engineering (Batch of 2027). Turned in at the primary lunch counter.', 'ID Cards & Documents', 'Main Cafeteria Counter', '2026-09-11', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80', 'Verified', 'Robert Vance', 'r.vance@campus.edu', '+1 (555) 456-7890', 'Staff'),

(4, 2, 'Lost', 'Honda Civic Car Key on Red Lanyard', 'Black Honda electronic smart key fob attached to a red woven college lanyard with a mini metal carabiner and a gym membership barcode tag.', 'Keys', 'North Parking Lot near Block B', '2026-09-09', 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80', 'Reported', 'Dr. Sarah Watson', 's.watson@campus.edu', '+1 (555) 567-8901', 'Faculty'),

(5, 2, 'Found', 'Advanced Engineering Mathematics (10th Ed)', 'Hardcover Erwin Kreyszig textbook left behind on desk row 3 after calculus lecture. Contains handwritten sticky notes and study summaries inside chapter 7.', 'Books & Stationery', 'Room 304 Science Block', '2026-09-08', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', 'Reported', 'Dr. Sarah Watson', 's.watson@campus.edu', '+1 (555) 567-8901', 'Faculty'),

(6, NULL, 'Lost', 'Fossil Black Leather Bi-fold Wallet', 'Distressed black genuine leather wallet. Contains student metro pass, driver license, and emergency cash. Lost during orientation symposium.', 'Wallets & Bags', 'Auditorium Foyer', '2026-09-07', 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80', 'Verified', 'David Chen', 'd.chen@campus.edu', '+1 (555) 678-9012', 'Student'),

(7, NULL, 'Found', 'Sony WH-1000XM4 Wireless Headphones', 'Matte black over-ear noise-cancelling headphones inside original zippered hard case with charging cable. Left at workstation station #14.', 'Electronics', 'Engineering Complex Lab 3', '2026-09-06', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', 'Returned', 'Robert Vance', 'r.vance@campus.edu', '+1 (555) 456-7890', 'Staff'),

(8, NULL, 'Lost', 'Vintage Denim Jacket with Club Badges', 'Light-wash oversized denim jacket with university debate society enamel pin on the left lapel and an embroidered solar system patch on the back.', 'Clothing', 'Student Activity Center', '2026-09-05', 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80', 'Returned', 'Emily Taylor', 'emily.t@campus.edu', '+1 (555) 789-0123', 'Student')
ON DUPLICATE KEY UPDATE item_name=VALUES(item_name);
