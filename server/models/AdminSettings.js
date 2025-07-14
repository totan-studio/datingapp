const { pool } = require('../config/db');

class AdminSettings {
  // Save or update a setting
  static async saveSettings(key, value) {
    try {
      const [result] = await pool.query(
        'INSERT INTO admin_settings (setting_key, setting_value) VALUES (?, ?) ' +
        'ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, JSON.stringify(value), JSON.stringify(value)]
      );
      
      return { key, value };
    } catch (error) {
      console.error('Error saving admin settings:', error);
      throw error;
    }
  }
  
  // Get a setting by key
  static async getByKey(key) {
    const [rows] = await pool.query(
      'SELECT * FROM admin_settings WHERE setting_key = ?',
      [key]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return {
      key: rows[0].setting_key,
      value: JSON.parse(rows[0].setting_value),
      updatedAt: rows[0].updated_at
    };
  }
}

module.exports = AdminSettings;