const { pool } = require('../config/db');

class Match {
  // Create a new match (like or pass)
  static async create(userId, targetUserId, action) {
    try {
      const [result] = await pool.query(
        'INSERT INTO matches (user_id, target_user_id, action) VALUES (?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE action = ?',
        [userId, targetUserId, action, action]
      );
      
      return { userId, targetUserId, action };
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }
  
  // Get all matches for a user
  static async getByUserId(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM matches WHERE user_id = ?',
      [userId]
    );
    
    return rows.map(match => ({
      userId: match.user_id,
      targetUserId: match.target_user_id,
      action: match.action,
      createdAt: match.created_at
    }));
  }
  
  // Check if two users have matched (both liked each other)
  static async checkMutualMatch(userId1, userId2) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM matches ' +
      'WHERE user_id = ? AND target_user_id = ? AND action = "like" ' +
      'AND EXISTS (SELECT 1 FROM matches WHERE user_id = ? AND target_user_id = ? AND action = "like")',
      [userId1, userId2, userId2, userId1]
    );
    
    return rows[0].count > 0;
  }
  
  // Get all mutual matches for a user
  static async getMutualMatches(userId) {
    const [rows] = await pool.query(
      'SELECT u.*, ' +
      '(SELECT COUNT(*) > 0 FROM users WHERE id = u.id AND is_online = TRUE) as is_online ' +
      'FROM users u ' +
      'WHERE u.id IN (' +
      '  SELECT m1.target_user_id ' +
      '  FROM matches m1 ' +
      '  JOIN matches m2 ON m1.target_user_id = m2.user_id AND m2.target_user_id = m1.user_id ' +
      '  WHERE m1.user_id = ? AND m1.action = "like" AND m2.action = "like"' +
      ')',
      [userId]
    );
    
    // Get photos for all matched users
    const userIds = rows.map(user => user.id);
    let photos = [];
    
    if (userIds.length > 0) {
      const [photoRows] = await pool.query(
        'SELECT user_id, photo_url FROM photos WHERE user_id IN (?)',
        [userIds]
      );
      photos = photoRows;
    }
    
    // Convert snake_case to camelCase and add photos
    return rows.map(user => {
      const userPhotos = photos
        .filter(photo => photo.user_id === user.id)
        .map(photo => photo.photo_url);
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        bio: user.bio,
        isAdmin: user.is_admin,
        isOnline: Boolean(user.is_online),
        createdAt: user.created_at,
        photos: userPhotos
      };
    });
  }
  
  // Get potential matches (users not yet swiped on)
  static async getPotentialMatches(userId) {
    const [rows] = await pool.query(
      'SELECT u.* FROM users u ' +
      'WHERE u.id != ? ' +
      'AND u.id NOT IN (' +
      '  SELECT target_user_id FROM matches WHERE user_id = ?' +
      ')',
      [userId, userId]
    );
    
    // Get photos for all potential matches
    const userIds = rows.map(user => user.id);
    let photos = [];
    
    if (userIds.length > 0) {
      const [photoRows] = await pool.query(
        'SELECT user_id, photo_url FROM photos WHERE user_id IN (?)',
        [userIds]
      );
      photos = photoRows;
    }
    
    // Convert snake_case to camelCase and add photos
    return rows.map(user => {
      const userPhotos = photos
        .filter(photo => photo.user_id === user.id)
        .map(photo => photo.photo_url);
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        bio: user.bio,
        isAdmin: user.is_admin,
        isOnline: Boolean(user.is_online),
        createdAt: user.created_at,
        photos: userPhotos
      };
    });
  }
}

module.exports = Match;