const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Demo users for testing the application
const createDemoUsers = async () => {
  const demoUsers = [
    {
      id: uuidv4(),
      email: 'alice@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Alice Johnson',
      age: 25,
      bio: 'Love hiking, photography, and trying new restaurants. Looking for someone to share adventures with! 📸🥾',
      photos: ['/uploads/demo-alice.jpg'],
      createdAt: new Date(),
      isOnline: false
    },
    {
      id: uuidv4(),
      email: 'sarah@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Sarah Williams',
      age: 28,
      bio: 'Yoga instructor and coffee enthusiast. Passionate about mindfulness and sustainable living. ☕🧘‍♀️',
      photos: ['/uploads/demo-sarah.jpg'],
      createdAt: new Date(),
      isOnline: false
    },
    {
      id: uuidv4(),
      email: 'emma@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Emma Davis',
      age: 24,
      bio: 'Artist and book lover. Spend my weekends painting and exploring local galleries. Always up for deep conversations! 🎨📚',
      photos: ['/uploads/demo-emma.jpg'],
      createdAt: new Date(),
      isOnline: false
    },
    {
      id: uuidv4(),
      email: 'lisa@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Lisa Chen',
      age: 26,
      bio: 'Software engineer by day, chef by night. Love cooking international cuisines and traveling to new places! 👩‍💻🍜',
      photos: ['/uploads/demo-lisa.jpg'],
      createdAt: new Date(),
      isOnline: false
    },
    {
      id: uuidv4(),
      email: 'mike@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Mike Thompson',
      age: 29,
      bio: 'Fitness enthusiast and outdoor adventurer. Rock climbing and mountain biking are my passions. Let\'s explore together! 🧗‍♂️🚵‍♂️',
      photos: ['/uploads/demo-mike.jpg'],
      createdAt: new Date(),
      isOnline: false
    },
    {
      id: uuidv4(),
      email: 'david@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'David Rodriguez',
      age: 27,
      bio: 'Musician and music producer. Play guitar and piano. Love live music and discovering new artists. 🎸🎹',
      photos: ['/uploads/demo-david.jpg'],
      createdAt: new Date(),
      isOnline: false
    }
  ];

  return demoUsers;
};

module.exports = { createDemoUsers };