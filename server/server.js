const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import database models
const { testConnection } = require('./config/db');
const { initializeDatabase } = require('./config/init-db');
const User = require('./models/User');
const Match = require('./models/Match');
const Message = require('./models/Message');
const AdminSettings = require('./models/AdminSettings');
const { createDemoUsers } = require('./demo-users');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// In-memory storage for online users
const onlineUsers = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Create uploads directory
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, age, bio } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    const userData = {
      id: userId,
      email,
      password: hashedPassword,
      name,
      age,
      bio,
      isAdmin: false
    };
    
    const user = await User.create(userData);
    
    const token = generateToken(userId);
    const userResponse = { ...user };
    delete userResponse.password;
    
    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user.id);
    const userResponse = { ...user };
    delete userResponse.password;
    
    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const photoUrl = `/uploads/${req.file.filename}`;
    await User.addPhoto(decoded.userId, photoUrl);
    
    res.json({ photoUrl });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/discover', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get users that haven't been swiped on yet
    const potentialMatches = await Match.getPotentialMatches(decoded.userId);
    
    // Remove passwords from response
    const safeMatches = potentialMatches.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    res.json(safeMatches);
  } catch (error) {
    console.error('Discover error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/swipe', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    const { targetUserId, action } = req.body; // action: 'like' or 'pass'
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = decoded.userId;
    
    // Save the swipe action
    await Match.create(userId, targetUserId, action);
    
    if (action === 'like') {
      // Check if it's a mutual match
      const isMatch = await Match.checkMutualMatch(userId, targetUserId);
      
      if (isMatch) {
        // It's a match!
        res.json({ match: true, targetUserId });
        
        // Notify both users via socket
        const currentUserSocket = onlineUsers.get(userId);
        const targetUserSocket = onlineUsers.get(targetUserId);
        
        if (currentUserSocket) {
          io.to(currentUserSocket).emit('new-match', { userId: targetUserId });
        }
        if (targetUserSocket) {
          io.to(targetUserSocket).emit('new-match', { userId });
        }
      } else {
        res.json({ match: false });
      }
    } else {
      res.json({ match: false });
    }
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/matches', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = decoded.userId;
    
    // Find mutual matches
    const mutualMatches = await Match.getMutualMatches(userId);
    
    res.json(mutualMatches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin routes for Agora settings
app.post('/api/admin/agora-settings', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { appId, appCertificate, tokenExpirationTime } = req.body;
    
    if (!appId || !appCertificate) {
      return res.status(400).json({ error: 'App ID and App Certificate are required' });
    }
    
    const agoraSettings = {
      appId,
      appCertificate,
      tokenExpirationTime: tokenExpirationTime || 3600, // Default 1 hour
      updatedAt: new Date()
    };
    
    await AdminSettings.saveSettings('agora', agoraSettings);
    
    res.json({ message: 'Agora settings updated successfully' });
  } catch (error) {
    console.error('Save Agora settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/agora-settings', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const agoraSettings = await AdminSettings.getByKey('agora');
    if (!agoraSettings) {
      return res.json({ configured: false });
    }
    
    // Don't send the certificate in the response for security
    res.json({
      configured: true,
      appId: agoraSettings.value.appId,
      tokenExpirationTime: agoraSettings.value.tokenExpirationTime,
      updatedAt: agoraSettings.value.updatedAt
    });
  } catch (error) {
    console.error('Get Agora settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Agora token for video calls
app.post('/api/agora/token', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { channelName, uid } = req.body;
    
    if (!channelName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }
    
    const agoraSettings = await AdminSettings.getByKey('agora');
    if (!agoraSettings) {
      return res.status(400).json({ error: 'Agora not configured. Please contact admin.' });
    }
    
    // For demo purposes, we'll return the app ID and a mock token
    // In production, you would generate a real token using Agora's token server
    const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      appId: agoraSettings.value.appId,
      token: mockToken,
      channelName,
      uid: uid || decoded.userId,
      expirationTime: Date.now() + (agoraSettings.value.tokenExpirationTime * 1000)
    });
  } catch (error) {
    console.error('Get Agora token error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('user-online', async (userId) => {
    onlineUsers.set(userId, socket.id);
    await User.updateOnlineStatus(userId, true);
    socket.userId = userId;
  });
  
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
  });
  
  socket.on('send-message', async (data) => {
    const { chatId, message, senderId } = data;
    
    const messageObj = {
      id: uuidv4(),
      chatId,
      senderId,
      message
    };
    
    // Save message to database
    await Message.create(messageObj);
    
    // Send to all users in the chat
    io.to(chatId).emit('new-message', {
      ...messageObj,
      timestamp: new Date()
    });
  });
  
  socket.on('get-messages', async (chatId) => {
    const chatMessages = await Message.getByChatId(chatId);
    socket.emit('chat-messages', chatMessages);
  });
  
  // WebRTC signaling (legacy)
  socket.on('call-user', (data) => {
    const { targetUserId, offer, callerId } = data;
    const targetSocket = onlineUsers.get(targetUserId);
    
    if (targetSocket) {
      io.to(targetSocket).emit('incoming-call', {
        offer,
        callerId,
        callerName: null // Will be fetched from database
      });
    }
  });
  
  socket.on('answer-call', (data) => {
    const { callerId, answer } = data;
    const callerSocket = onlineUsers.get(callerId);
    
    if (callerSocket) {
      io.to(callerSocket).emit('call-answered', { answer });
    }
  });
  
  socket.on('ice-candidate', (data) => {
    const { targetUserId, candidate } = data;
    const targetSocket = onlineUsers.get(targetUserId);
    
    if (targetSocket) {
      io.to(targetSocket).emit('ice-candidate', { candidate });
    }
  });
  
  socket.on('end-call', (data) => {
    const { targetUserId } = data;
    const targetSocket = onlineUsers.get(targetUserId);
    
    if (targetSocket) {
      io.to(targetSocket).emit('call-ended');
    }
  });

  // Agora video calling events
  socket.on('agora-call-request', async (data) => {
    const { targetUserId, callerId, channelName } = data;
    const targetSocket = onlineUsers.get(targetUserId);
    
    // Get caller name from database
    const caller = await User.findById(callerId);
    const callerName = caller ? caller.name : 'Unknown';
    
    if (targetSocket) {
      io.to(targetSocket).emit('agora-call-request', {
        callerId,
        callerName,
        channelName
      });
    }
  });

  socket.on('agora-call-accepted', (data) => {
    const { callerId, accepterId } = data;
    const callerSocket = onlineUsers.get(callerId);
    
    if (callerSocket) {
      io.to(callerSocket).emit('agora-call-accepted', { accepterId });
    }
  });

  socket.on('agora-call-rejected', (data) => {
    const { callerId, rejecterId } = data;
    const callerSocket = onlineUsers.get(callerId);
    
    if (callerSocket) {
      io.to(callerSocket).emit('agora-call-rejected', { rejecterId });
    }
  });

  socket.on('agora-call-ended', (data) => {
    const { targetUserId } = data;
    const targetSocket = onlineUsers.get(targetUserId);
    
    if (targetSocket) {
      io.to(targetSocket).emit('agora-call-ended');
    }
  });
  
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      await User.updateOnlineStatus(socket.userId, false);
    }
  });
});

// Initialize demo users
const initializeDemoUsers = async () => {
  try {
    // Check if there are any users in the database
    const allUsers = await User.getAll();
    
    if (allUsers.length === 0) {
      console.log('No users found, creating demo users...');
      const demoUsers = await createDemoUsers();
      
      // Insert demo users into the database
      for (const user of demoUsers) {
        await User.create(user);
        
        // Add photos for the user
        if (user.photos && user.photos.length > 0) {
          for (const photoUrl of user.photos) {
            await User.addPhoto(user.id, photoUrl);
          }
        }
      }
      
      console.log(`Added ${demoUsers.length} demo users`);
    } else {
      console.log(`Found ${allUsers.length} existing users`);
    }
  } catch (error) {
    console.error('Error initializing demo users:', error);
  }
};

// Start the server
const PORT = process.env.PORT || 12001;

const startServer = async () => {
  try {
    // Initialize the database
    await initializeDatabase();
    
    // Test the database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to the database. Exiting...');
      process.exit(1);
    }
    
    // Start the server
    server.listen(PORT, '0.0.0.0', async () => {
      console.log(`Server running on port ${PORT}`);
      await initializeDemoUsers();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();