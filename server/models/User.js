const { pool } = require('../config/db');

class User {
  // Create a new user
  static async create(userData) {
    const { id, email, password, name, age, bio, isAdmin = false } = userData;
    
    const [result] = await pool.query(
      'INSERT INTO users (id, email, password, name, age, bio, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, email, password, name, age, bio, isAdmin]
    );
    
    return { id, ...userData };
  }
  
  // Find user by email
  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const user = rows[0];
    
    // Convert snake_case to camelCase
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      age: user.age,
      bio: user.bio,
      isAdmin: user.is_admin,
      isOnline: user.is_online,
      createdAt: user.created_at
    };
  }
  
  // Find user by ID
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const user = rows[0];
    
    // Get user photos
    const [photos] = await pool.query('SELECT photo_url FROM photos WHERE user_id = ?', [id]);
    
    // Convert snake_case to camelCase
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      age: user.age,
      bio: user.bio,
      isAdmin: user.is_admin,
      isOnline: user.is_online,
      createdAt: user.created_at,
      photos: photos.map(photo => photo.photo_url)
    };
  }
  
  // Get all users
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM users');
    
    // Get photos for all users
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
        password: user.password,
        name: user.name,
        age: user.age,
        bio: user.bio,
        isAdmin: user.is_admin,
        isOnline: user.is_online,
        createdAt: user.created_at,
        photos: userPhotos
      };
    });
  }
  
  // Update user online status
  static async updateOnlineStatus(id, isOnline) {
    await pool.query('UPDATE users SET is_online = ? WHERE id = ?', [isOnline, id]);
  }
  
  // Add photo to user
  static async addPhoto(userId, photoUrl) {
    const [result] = await pool.query(
      'INSERT INTO photos (user_id, photo_url) VALUES (?, ?)',
      [userId, photoUrl]
    );
    
    return { id: result.insertId, userId, photoUrl };
  }
}

module.exports = User;