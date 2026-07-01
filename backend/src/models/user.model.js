import db from '../config/db.js';

const UserModel = {
  /**
   * Find user by email
   */
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  /**
   * Find user by ID
   */
  findById(id) {
    return db.prepare('SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE id = ?').get(id);
  },

  /**
   * Create a new user
   */
  create({ email, passwordHash, fullName, role = 'user' }) {
    const result = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `).run(email, passwordHash, fullName, role);

    return this.findById(result.lastInsertRowid);
  },

  /**
   * Get all users (admin only)
   */
  findAll() {
    return db.prepare('SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC').all();
  },

  /**
   * Count total users
   */
  count() {
    return db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  }
};

export default UserModel;
