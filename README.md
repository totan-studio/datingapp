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

### Google Cloud Platform (GCP) Deployment

#### Prerequisites
- Google Cloud account with billing enabled
- Google Cloud SDK installed locally
- Docker installed (for containerized deployment)

#### Option 1: App Engine Deployment (Recommended)

**1. Setup GCP Project**
```bash
# Create a new project
gcloud projects create loveconnect-dating-app --name="LoveConnect Dating App"

# Set the project
gcloud config set project loveconnect-dating-app

# Enable required APIs
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage-api.googleapis.com
```

**2. Prepare Backend for App Engine**

Create `server/app.yaml`:
```yaml
runtime: nodejs18

env_variables:
  JWT_SECRET: "your-super-secret-jwt-key-change-in-production"
  NODE_ENV: "production"

automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.6

resources:
  cpu: 1
  memory_gb: 0.5
  disk_size_gb: 10
```

**3. Deploy Backend**
```bash
cd server
gcloud app deploy app.yaml
```

**4. Prepare Frontend for App Engine**

Create `client/app.yaml`:
```yaml
runtime: nodejs18

handlers:
- url: /static
  static_dir: dist/static
  secure: always

- url: /.*
  static_files: dist/index.html
  upload: dist/index.html
  secure: always

env_variables:
  NODE_ENV: "production"
```

Update `client/src/context/AuthContext.jsx` with your backend URL:
```javascript
const API_BASE_URL = 'https://your-backend-service-dot-loveconnect-dating-app.appspot.com'
```

**5. Build and Deploy Frontend**
```bash
cd client
npm run build
gcloud app deploy app.yaml
```

#### Option 2: Cloud Run Deployment (Containerized)

**1. Create Dockerfiles**

Backend `server/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
```

Frontend `client/Dockerfile`:
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**2. Build and Deploy with Cloud Run**
```bash
# Build and push backend
cd server
gcloud builds submit --tag gcr.io/loveconnect-dating-app/backend
gcloud run deploy backend --image gcr.io/loveconnect-dating-app/backend --platform managed --region us-central1 --allow-unauthenticated

# Build and push frontend
cd ../client
gcloud builds submit --tag gcr.io/loveconnect-dating-app/frontend
gcloud run deploy frontend --image gcr.io/loveconnect-dating-app/frontend --platform managed --region us-central1 --allow-unauthenticated
```

#### Option 3: Compute Engine Deployment

**1. Create VM Instance**
```bash
gcloud compute instances create loveconnect-vm \
    --zone=us-central1-a \
    --machine-type=e2-medium \
    --network-interface=network-tier=PREMIUM,subnet=default \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --tags=http-server,https-server \
    --create-disk=auto-delete=yes,boot=yes,device-name=loveconnect-vm,image=projects/ubuntu-os-cloud/global/images/ubuntu-2004-focal-v20231101,mode=rw,size=20,type=projects/loveconnect-dating-app/zones/us-central1-a/diskTypes/pd-balanced \
    --no-shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --reservation-affinity=any
```

**2. Setup Firewall Rules**
```bash
gcloud compute firewall-rules create allow-loveconnect \
    --allow tcp:3000,tcp:3001,tcp:80,tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow LoveConnect app ports"
```

**3. SSH and Setup Application**
```bash
gcloud compute ssh loveconnect-vm --zone=us-central1-a

# On the VM:
sudo apt update
sudo apt install -y nodejs npm nginx

# Clone and setup your app
git clone https://github.com/yourusername/loveconnect-dating-app.git
cd loveconnect-dating-app
npm install
cd client && npm install && npm run build
cd ../server && npm install

# Setup PM2 for process management
sudo npm install -g pm2
pm2 start server.js --name "loveconnect-backend"
pm2 startup
pm2 save

# Configure Nginx
sudo cp /path/to/nginx.conf /etc/nginx/sites-available/loveconnect
sudo ln -s /etc/nginx/sites-available/loveconnect /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

#### Database Setup (Production)

**1. Cloud SQL (PostgreSQL)**
```bash
# Create Cloud SQL instance
gcloud sql instances create loveconnect-db \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=us-central1

# Create database
gcloud sql databases create loveconnect --instance=loveconnect-db

# Create user
gcloud sql users create loveconnect-user --instance=loveconnect-db --password=secure-password
```

**2. Cloud Storage (File Uploads)**
```bash
# Create storage bucket
gsutil mb gs://loveconnect-uploads

# Set public read access for profile photos
gsutil iam ch allUsers:objectViewer gs://loveconnect-uploads
```

#### Environment Variables for Production

Update your environment variables:
```bash
# Backend environment variables
JWT_SECRET=your-super-secure-jwt-secret-key
DATABASE_URL=postgresql://loveconnect-user:password@/loveconnect?host=/cloudsql/loveconnect-dating-app:us-central1:loveconnect-db
GOOGLE_CLOUD_PROJECT_ID=loveconnect-dating-app
STORAGE_BUCKET=loveconnect-uploads
NODE_ENV=production
```

#### Monitoring and Logging

**1. Enable Cloud Monitoring**
```bash
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

**2. Setup Alerts**
```bash
# Create uptime check
gcloud alpha monitoring uptime create loveconnect-uptime \
    --display-name="LoveConnect Uptime Check" \
    --http-check-path="/" \
    --hostname="your-app-url.appspot.com"
```

### Other Deployment Options

#### Vercel (Frontend Only)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

#### Railway (Full-Stack)
1. Connect GitHub repository to Railway
2. Configure environment variables
3. Deploy both frontend and backend services

#### DigitalOcean App Platform
1. Create new app from GitHub repository
2. Configure build and run commands
3. Set environment variables
4. Deploy with automatic scaling

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