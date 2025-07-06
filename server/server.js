const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
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

// In-memory storage (in production, use a proper database)
const users = new Map();
const matches = new Map();
const messages = new Map();
const onlineUsers = new Map();

const JWT_SECRET = 'your-secret-key';

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
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, age, bio } = req.body;
    
    // Check if user already exists
    for (const [id, user] of users) {
      if (user.email === email) {
        return res.status(400).json({ error: 'User already exists' });
      }
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    const user = {
      id: userId,
      email,
      password: hashedPassword,
      name,
      age,
      bio,
      photos: [],
      createdAt: new Date(),
      isOnline: false
    };
    
    users.set(userId, user);
    
    const token = generateToken(userId);
    const userResponse = { ...user };
    delete userResponse.password;
    
    res.json({ token, user: userResponse });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    let foundUser = null;
    for (const [id, user] of users) {
      if (user.email === email) {
        foundUser = user;
        break;
      }
    }
    
    if (!foundUser) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, foundUser.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(foundUser.id);
    const userResponse = { ...foundUser };
    delete userResponse.password;
    
    res.json({ token, user: userResponse });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/upload-photo', upload.single('photo'), (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = users.get(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const photoUrl = `/uploads/${req.file.filename}`;
    user.photos.push(photoUrl);
    
    res.json({ photoUrl });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/discover', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const currentUser = users.get(decoded.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get users that haven't been swiped on yet
    const swipedUsers = matches.get(decoded.userId) || { liked: [], passed: [] };
    const allSwipedIds = [...swipedUsers.liked, ...swipedUsers.passed];
    
    const potentialMatches = Array.from(users.values())
      .filter(user => 
        user.id !== decoded.userId && 
        !allSwipedIds.includes(user.id)
        // Removed photo requirement for demo purposes
      )
      .map(user => {
        const userCopy = { ...user };
        delete userCopy.password;
        return userCopy;
      });
    
    res.json(potentialMatches);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/swipe', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    const { targetUserId, action } = req.body; // action: 'like' or 'pass'
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = decoded.userId;
    
    if (!matches.has(userId)) {
      matches.set(userId, { liked: [], passed: [] });
    }
    
    const userMatches = matches.get(userId);
    
    if (action === 'like') {
      userMatches.liked.push(targetUserId);
      
      // Check if it's a mutual match
      const targetMatches = matches.get(targetUserId);
      if (targetMatches && targetMatches.liked.includes(userId)) {
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
      userMatches.passed.push(targetUserId);
      res.json({ match: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/matches', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = decoded.userId;
    const userMatches = matches.get(userId);
    
    if (!userMatches) {
      return res.json([]);
    }
    
    // Find mutual matches
    const mutualMatches = [];
    for (const likedUserId of userMatches.liked) {
      const otherUserMatches = matches.get(likedUserId);
      if (otherUserMatches && otherUserMatches.liked.includes(userId)) {
        const matchedUser = users.get(likedUserId);
        if (matchedUser) {
          const userCopy = { ...matchedUser };
          delete userCopy.password;
          userCopy.isOnline = onlineUsers.has(likedUserId);
          mutualMatches.push(userCopy);
        }
      }
    }
    
    res.json(mutualMatches);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('user-online', (userId) => {
    onlineUsers.set(userId, socket.id);
    const user = users.get(userId);
    if (user) {
      user.isOnline = true;
    }
    socket.userId = userId;
  });
  
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
  });
  
  socket.on('send-message', (data) => {
    const { chatId, message, senderId } = data;
    
    if (!messages.has(chatId)) {
      messages.set(chatId, []);
    }
    
    const messageObj = {
      id: uuidv4(),
      senderId,
      message,
      timestamp: new Date()
    };
    
    messages.get(chatId).push(messageObj);
    
    // Send to all users in the chat
    io.to(chatId).emit('new-message', messageObj);
  });
  
  socket.on('get-messages', (chatId) => {
    const chatMessages = messages.get(chatId) || [];
    socket.emit('chat-messages', chatMessages);
  });
  
  // WebRTC signaling
  socket.on('call-user', (data) => {
    const { targetUserId, offer, callerId } = data;
    const targetSocket = onlineUsers.get(targetUserId);
    
    if (targetSocket) {
      io.to(targetSocket).emit('incoming-call', {
        offer,
        callerId,
        callerName: users.get(callerId)?.name
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
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      const user = users.get(socket.userId);
      if (user) {
        user.isOnline = false;
      }
    }
  });
});

// Initialize demo users
const initializeDemoUsers = async () => {
  if (users.size === 0) {
    const demoUsers = await createDemoUsers();
    demoUsers.forEach(user => {
      users.set(user.id, user);
    });
    console.log(`Added ${demoUsers.length} demo users`);
  }
};

const PORT = process.env.PORT || 12001;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeDemoUsers();
});