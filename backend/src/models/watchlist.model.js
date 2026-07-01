import db from '../config/db.js';

const WatchlistModel = {
  /**
   * Find all items for a specific user
   */
  findByUserId(userId) {
    return db.prepare(`
      SELECT * FROM watchlist_items 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(userId);
  },

  /**
   * Find all items (admin view) with user info
   */
  findAll() {
    return db.prepare(`
      SELECT w.*, u.email as user_email, u.full_name as user_name
      FROM watchlist_items w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `).all();
  },

  /**
   * Find a single item by ID
   */
  findById(id) {
    return db.prepare('SELECT * FROM watchlist_items WHERE id = ?').get(id);
  },

  /**
   * Create a new watchlist item
   */
  create({ userId, symbol, name, targetPrice, notes = '', alertType = 'above' }) {
    const result = db.prepare(`
      INSERT INTO watchlist_items (user_id, symbol, name, target_price, notes, alert_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, symbol.toUpperCase(), name, targetPrice, notes, alertType);

    return this.findById(result.lastInsertRowid);
  },

  /**
   * Update a watchlist item
   */
  update(id, { symbol, name, targetPrice, notes, alertType }) {
    const fields = [];
    const values = [];

    if (symbol !== undefined) { fields.push('symbol = ?'); values.push(symbol.toUpperCase()); }
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (targetPrice !== undefined) { fields.push('target_price = ?'); values.push(targetPrice); }
    if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }
    if (alertType !== undefined) { fields.push('alert_type = ?'); values.push(alertType); }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`
      UPDATE watchlist_items 
      SET ${fields.join(', ')}
      WHERE id = ?
    `).run(...values);

    return this.findById(id);
  },

  /**
   * Delete a watchlist item
   */
  delete(id) {
    return db.prepare('DELETE FROM watchlist_items WHERE id = ?').run(id);
  },

  /**
   * Count items for a user
   */
  countByUserId(userId) {
    return db.prepare('SELECT COUNT(*) as count FROM watchlist_items WHERE user_id = ?').get(userId).count;
  },

  /**
   * Count all items
   */
  countAll() {
    return db.prepare('SELECT COUNT(*) as count FROM watchlist_items').get().count;
  }
};

export default WatchlistModel;
