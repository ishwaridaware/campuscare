/**
 * CAMPUS CARE - Database Connection Configuration
 * Establishes a connection pool using mysql2/promise
 */

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_care_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Automatically initializes database and tables if they do not exist
 */
async function initDB() {
  try {
    // 1. Connect without database first to ensure database exists
    const rootConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConnection.end();

    // 2. Test pool connection to the target database
    const conn = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);

    // 3. Ensure users table exists
    await conn.query(`
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
    `);

    // 4. Ensure items table exists
    await conn.query(`
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
    `);

    // 5. Check if sample items exist, if not populate seed data from schema.sql
    const [existingItems] = await conn.query('SELECT COUNT(*) as count FROM items');
    if (existingItems[0].count === 0) {
      console.log('[Database] Database tables empty, loading initial sample data...');
      const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        // Execute SQL commands separated by semicolons (ignoring comments)
        const statements = schemaSql
          .replace(/--.*$/gm, '')
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));

        for (const statement of statements) {
          try {
            await conn.query(statement);
          } catch (stmtErr) {
            // Ignore duplicate key or warning during initial seed
          }
        }
        console.log('[Database] Sample items and demo users loaded successfully.');
      }
    }

    conn.release();
  } catch (error) {
    console.error('[Database Error] Could not connect to MySQL server:', error.message);
    console.error('[Database Hint] Make sure MySQL is running in XAMPP or service on port ' + dbConfig.port);
  }
}

module.exports = {
  pool,
  initDB
};
