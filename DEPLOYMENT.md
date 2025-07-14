# LoveConnect - Google Cloud Platform Deployment Guide

This guide provides step-by-step instructions for deploying the LoveConnect Dating App to Google Cloud Platform.

## 🚀 Quick Deployment

### Prerequisites
- Google Cloud account with billing enabled
- Google Cloud SDK installed locally
- Git repository access

### One-Command Deployment
```bash
# Make the deployment script executable
chmod +x deploy-gcp.sh

# Run the deployment
./deploy-gcp.sh
```

This script will:
1. Create a new GCP project
2. Enable required APIs
3. Deploy backend to Cloud Run
4. Deploy frontend to Cloud Run
5. Setup monitoring
6. Provide access URLs

## 📋 Manual Deployment Steps

### 1. Setup Google Cloud Project

```bash
# Install Google Cloud SDK if not already installed
# Visit: https://cloud.google.com/sdk/docs/install

# Authenticate with Google Cloud
gcloud auth login

# Create a new project
gcloud projects create loveconnect-dating-app --name="LoveConnect Dating App"

# Set the project
gcloud config set project loveconnect-dating-app

# Enable required APIs
gcloud services enable \
    appengine.googleapis.com \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    storage-api.googleapis.com \
    sql-component.googleapis.com \
    monitoring.googleapis.com \
    logging.googleapis.com
```

### 2. Deploy Backend Service

```bash
cd server

# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/loveconnect-dating-app/backend

gcloud run deploy loveconnect-backend \
    --image gcr.io/loveconnect-dating-app/backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=production,JWT_SECRET=your-super-secret-jwt-key" \
    --memory=512Mi \
    --cpu=1 \
    --max-instances=10

# Get backend URL
gcloud run services describe loveconnect-backend \
    --platform managed \
    --region us-central1 \
    --format 'value(status.url)'
```

### 3. Deploy Frontend Service

```bash
cd ../client

# Update API base URL in AuthContext.jsx with your backend URL
# Replace: const API_BASE_URL = '...'
# With: const API_BASE_URL = 'https://your-backend-url'

# Build the frontend
npm run build

# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/loveconnect-dating-app/frontend

gcloud run deploy loveconnect-frontend \
    --image gcr.io/loveconnect-dating-app/frontend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port=80 \
    --memory=256Mi \
    --cpu=1 \
    --max-instances=5
```

### 4. Configure Agora Video Calling

After deployment:

1. **Get Agora Credentials**:
   - Visit [Agora Console](https://console.agora.io/)
   - Create a new project
   - Copy the App ID
   - Generate an App Certificate

2. **Configure via Admin Dashboard**:
   - Visit your deployed frontend URL
   - Login as admin: `admin@loveconnect.com` / `admin123`
   - Navigate to Admin Dashboard
   - Enter your Agora App ID and App Certificate
   - Set token expiration time
   - Save settings

## 🔧 Alternative Deployment Options

### App Engine Deployment

#### Backend (App Engine)
```bash
cd server

# Create app.yaml (already provided)
gcloud app deploy app.yaml

# Get URL
gcloud app browse
```

#### Frontend (App Engine)
```bash
cd client

# Build the application
npm run build

# Create app.yaml (already provided)
gcloud app deploy app.yaml
```

### Compute Engine Deployment

```bash
# Create VM instance
gcloud compute instances create loveconnect-vm \
    --zone=us-central1-a \
    --machine-type=e2-medium \
    --network-interface=network-tier=PREMIUM,subnet=default \
    --maintenance-policy=MIGRATE \
    --tags=http-server,https-server \
    --create-disk=auto-delete=yes,boot=yes,image=projects/ubuntu-os-cloud/global/images/ubuntu-2004-focal-v20231101,size=20 \
    --reservation-affinity=any

# Setup firewall rules
gcloud compute firewall-rules create allow-loveconnect \
    --allow tcp:3000,tcp:3001,tcp:80,tcp:443 \
    --source-ranges 0.0.0.0/0

# SSH into the instance
gcloud compute ssh loveconnect-vm --zone=us-central1-a

# On the VM, install dependencies and setup the application
sudo apt update
sudo apt install -y nodejs npm nginx git
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
```

## 🗄️ Database Setup (Production)

### Cloud SQL (PostgreSQL)
```bash
# Create Cloud SQL instance
gcloud sql instances create loveconnect-db \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=us-central1

# Create database
gcloud sql databases create loveconnect --instance=loveconnect-db

# Create user
gcloud sql users create loveconnect-user \
    --instance=loveconnect-db \
    --password=secure-password

# Get connection string
gcloud sql instances describe loveconnect-db
```

### Cloud Storage (File Uploads)
```bash
# Create storage bucket for uploads
gsutil mb gs://loveconnect-uploads

# Set public read access for profile photos
gsutil iam ch allUsers:objectViewer gs://loveconnect-uploads

# Configure CORS for web uploads
echo '[{"origin": ["*"], "method": ["GET", "POST"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600}]' > cors.json
gsutil cors set cors.json gs://loveconnect-uploads
```

## 📊 Monitoring and Logging

### Setup Monitoring
```bash
# Create uptime check
gcloud alpha monitoring uptime create loveconnect-uptime \
    --display-name="LoveConnect Uptime Check" \
    --http-check-path="/" \
    --hostname="your-frontend-url.run.app"

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=loveconnect-backend"
```

### Cost Monitoring
```bash
# Set up billing alerts
gcloud alpha billing budgets create \
    --billing-account=YOUR_BILLING_ACCOUNT_ID \
    --display-name="LoveConnect Budget" \
    --budget-amount=50USD \
    --threshold-rule=percent=90,basis=CURRENT_SPEND
```

## 🔒 Security Configuration

### Environment Variables
Set these environment variables in your deployment:

```bash
# Backend
JWT_SECRET=your-super-secure-jwt-secret-key
NODE_ENV=production
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-app-certificate
DATABASE_URL=postgresql://user:password@host:port/database
STORAGE_BUCKET=loveconnect-uploads

# Frontend
NODE_ENV=production
REACT_APP_API_URL=https://your-backend-url
```

### SSL/TLS
Cloud Run automatically provides SSL certificates. For custom domains:

```bash
# Map custom domain
gcloud run domain-mappings create \
    --service loveconnect-frontend \
    --domain your-domain.com \
    --region us-central1
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build logs
   gcloud builds log [BUILD_ID]
   ```

2. **Service Not Starting**:
   ```bash
   # Check service logs
   gcloud run logs read loveconnect-backend --region us-central1
   ```

3. **Video Calling Not Working**:
   - Verify Agora credentials are configured
   - Check browser console for errors
   - Ensure HTTPS is enabled (required for camera/microphone access)

4. **Database Connection Issues**:
   ```bash
   # Test database connection
   gcloud sql connect loveconnect-db --user=loveconnect-user
   ```

### Performance Optimization

1. **Enable CDN**:
   ```bash
   gcloud compute backend-services create loveconnect-backend-service
   gcloud compute url-maps create loveconnect-url-map
   ```

2. **Configure Caching**:
   - Set appropriate cache headers for static assets
   - Use Cloud CDN for global content delivery

3. **Auto-scaling**:
   ```bash
   # Update Cloud Run service with auto-scaling
   gcloud run services update loveconnect-backend \
       --min-instances=1 \
       --max-instances=100 \
       --concurrency=80
   ```

## 📈 Scaling Considerations

### Traffic Growth
- **Low Traffic** (< 1000 users): Current setup sufficient
- **Medium Traffic** (1000-10000 users): Add Cloud SQL, Redis cache
- **High Traffic** (10000+ users): Consider Kubernetes, load balancers

### Cost Optimization
- Use Cloud Run's pay-per-use pricing
- Implement proper caching strategies
- Monitor and optimize database queries
- Use Cloud Storage for static assets

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GCP
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: google-github-actions/setup-gcloud@v0
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: loveconnect-dating-app
    - run: ./deploy-gcp.sh
```

## 📞 Support

For deployment issues:
1. Check Google Cloud Console logs
2. Review this documentation
3. Consult Google Cloud documentation
4. Contact support if needed

---

**Happy Deploying! 🚀**