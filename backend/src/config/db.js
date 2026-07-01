import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dbPath = process.env.DB_PATH || './data/database.sqlite';
const dbDir = path.dirname(path.resolve(__dirname, '..', '..', dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const resolvedDbPath = path.resolve(__dirname, '..', '..', dbPath);
const db = new Database(resolvedDbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 */
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS watchlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      target_price REAL,
      notes TEXT DEFAULT '',
      alert_type TEXT DEFAULT 'above' CHECK(alert_type IN ('above', 'below')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  console.log('✅ Database schema initialized');

  // Seed default admin account
  seedAdminAccount();
}

/**
 * Seed default admin account if it doesn't exist
 */
function seedAdminAccount() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@primetrade.ai';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

  if (!existing) {
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(adminPassword, salt);

    db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `).run(adminEmail, passwordHash, 'System Admin', 'admin');

    console.log(`✅ Default admin account created: ${adminEmail}`);
  } else {
    console.log(`ℹ️  Admin account already exists: ${adminEmail}`);
  }
}

export default db;
