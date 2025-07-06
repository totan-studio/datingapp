# LoveConnect - Video Dating App

A modern, full-stack video dating application built with React, Node.js, Socket.io, and WebRTC. Features real-time messaging, video calling, and a Tinder-like swipe interface.

## 🚀 Features

- **User Authentication**: Secure registration and login system
- **Profile Management**: Upload photos and manage profile information
- **Swipe Interface**: Tinder-like card swiping to discover potential matches
- **Real-time Matching**: Instant notifications when someone likes you back
- **Live Chat**: Real-time messaging with matched users
- **Video Calling**: WebRTC-powered video calls with camera/microphone controls
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Beautiful gradient design with smooth animations

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time communication
- **React Spring** - Smooth animations
- **Framer Motion** - Advanced animations
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.io** - Real-time bidirectional communication
- **WebRTC** - Peer-to-peer video calling
- **Multer** - File upload handling
- **bcryptjs** - Password hashing
- **JWT** - Authentication tokens

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd video-dating-app
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on port 12001
   - Frontend development server on port 12000

## 🌐 Access the Application

- **Frontend**: https://work-1-fqgbvgfiamltorll.prod-runtime.all-hands.dev
- **Backend API**: https://work-2-fqgbvgfiamltorll.prod-runtime.all-hands.dev

## 📱 How to Use

### 1. Registration
- Create an account with email, password, name, age, and bio
- Must be 18+ years old to register

### 2. Profile Setup
- Upload up to 6 photos (first photo becomes main profile picture)
- Edit your bio and personal information
- Complete your profile to start getting matches

### 3. Discover People
- Swipe right (❤️) to like someone
- Swipe left (❌) to pass
- Use the action buttons if you prefer clicking over swiping
- Get instant notifications when it's a match!

### 4. Chat with Matches
- View all your matches in the Matches section
- Start conversations with matched users
- Real-time messaging with timestamps
- See online/offline status

### 5. Video Calling
- Start video calls with online matches
- Full camera and microphone controls
- High-quality WebRTC peer-to-peer connection
- Call duration tracking

## 🔧 Development

### Project Structure
```
video-dating-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── server/                 # Node.js backend
│   ├── server.js           # Main server file
│   └── uploads/            # User uploaded photos
└── package.json            # Root package.json
```

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run client` - Start only the frontend development server
- `npm run server` - Start only the backend server
- `npm run build` - Build the frontend for production
- `npm run install-all` - Install dependencies for both frontend and backend

### Environment Configuration

The application is configured to work with the provided runtime URLs:
- Frontend: Port 12000
- Backend: Port 12001

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- File upload validation and size limits
- CORS configuration for secure cross-origin requests
- Input validation and sanitization

## 📊 Data Storage

Currently uses in-memory storage for simplicity. In production, you would want to integrate:
- **Database**: MongoDB, PostgreSQL, or MySQL for persistent data storage
- **File Storage**: AWS S3, Cloudinary, or similar for photo storage
- **Redis**: For session management and real-time data

## 🎨 UI/UX Features

- **Gradient Design**: Beautiful pink-to-red gradient theme
- **Smooth Animations**: Framer Motion and React Spring animations
- **Responsive Layout**: Works on all device sizes
- **Loading States**: Proper loading indicators throughout the app
- **Error Handling**: User-friendly error messages
- **Accessibility**: Semantic HTML and keyboard navigation support

## 🚀 Deployment

For production deployment:

1. **Build the frontend**
   ```bash
   cd client && npm run build
   ```

2. **Configure environment variables**
   - Set proper JWT secret
   - Configure database connections
   - Set up file storage service

3. **Deploy to your preferred platform**
   - Vercel, Netlify (frontend)
   - Heroku, Railway, DigitalOcean (backend)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Ensure both frontend and backend servers are running
3. Verify camera/microphone permissions for video calling
4. Check network connectivity for real-time features

---

**Happy Dating! 💕**