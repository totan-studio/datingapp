const { pool } = require('../config/db');

class Message {
  // Create a new message
  static async create(messageData) {
    const { id, chatId, senderId, message } = messageData;
    
    const [result] = await pool.query(
      'INSERT INTO messages (id, chat_id, sender_id, message) VALUES (?, ?, ?, ?)',
      [id, chatId, senderId, message]
    );
    
    return {
      id,
      chatId,
      senderId,
      message,
      timestamp: new Date()
    };
  }
  
  // Get messages for a chat
  static async getByChatId(chatId) {
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC',
      [chatId]
    );
    
    return rows.map(message => ({
      id: message.id,
      chatId: message.chat_id,
      senderId: message.sender_id,
      message: message.message,
      timestamp: message.timestamp
    }));
  }
}

module.exports = Message;