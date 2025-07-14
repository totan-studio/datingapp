#!/bin/bash

# LoveConnect Dating App - Google Cloud Platform Deployment Script
# This script automates the deployment process to GCP

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="loveconnect-dating-app"
REGION="us-central1"
BACKEND_SERVICE="loveconnect-backend"
FRONTEND_SERVICE="loveconnect-frontend"

echo -e "${BLUE}🚀 LoveConnect Dating App - GCP Deployment${NC}"
echo "=================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud SDK is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Function to check if user is authenticated
check_auth() {
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${RED}❌ Not authenticated with Google Cloud. Please run 'gcloud auth login'${NC}"
        exit 1
    fi
}

# Function to create project if it doesn't exist
create_project() {
    echo -e "${YELLOW}📋 Checking project: $PROJECT_ID${NC}"
    
    if ! gcloud projects describe $PROJECT_ID &> /dev/null; then
        echo -e "${YELLOW}🆕 Creating new project: $PROJECT_ID${NC}"
        gcloud projects create $PROJECT_ID --name="LoveConnect Dating App"
    else
        echo -e "${GREEN}✅ Project $PROJECT_ID already exists${NC}"
    fi
    
    gcloud config set project $PROJECT_ID
}

# Function to enable required APIs
enable_apis() {
    echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
    
    gcloud services enable \
        appengine.googleapis.com \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        storage-api.googleapis.com \
        sql-component.googleapis.com \
        monitoring.googleapis.com \
        logging.googleapis.com
    
    echo -e "${GREEN}✅ APIs enabled${NC}"
}

# Function to deploy backend
deploy_backend() {
    echo -e "${YELLOW}🔧 Deploying backend service...${NC}"
    
    cd server
    
    # Build and deploy to Cloud Run
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE
    
    gcloud run deploy $BACKEND_SERVICE \
        --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --set-env-vars="NODE_ENV=production,JWT_SECRET=your-super-secret-jwt-key-change-in-production" \
        --memory=512Mi \
        --cpu=1 \
        --max-instances=10
    
    # Get backend URL
    BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --platform managed --region $REGION --format 'value(status.url)')
    echo -e "${GREEN}✅ Backend deployed at: $BACKEND_URL${NC}"
    
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${YELLOW}🔧 Deploying frontend service...${NC}"
    
    cd client
    
    # Update API base URL in the frontend
    if [ ! -z "$BACKEND_URL" ]; then
        echo -e "${YELLOW}📝 Updating API base URL to: $BACKEND_URL${NC}"
        sed -i "s|const API_BASE_URL = '.*'|const API_BASE_URL = '$BACKEND_URL'|g" src/context/AuthContext.jsx
    fi
    
    # Build the frontend
    npm run build
    
    # Build and deploy to Cloud Run
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE
    
    gcloud run deploy $FRONTEND_SERVICE \
        --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port=80 \
        --memory=256Mi \
        --cpu=1 \
        --max-instances=5
    
    # Get frontend URL
    FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --platform managed --region $REGION --format 'value(status.url)')
    echo -e "${GREEN}✅ Frontend deployed at: $FRONTEND_URL${NC}"
    
    cd ..
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "${YELLOW}📊 Setting up monitoring...${NC}"
    
    # Create uptime check for frontend
    gcloud alpha monitoring uptime create loveconnect-uptime \
        --display-name="LoveConnect Uptime Check" \
        --http-check-path="/" \
        --hostname="$(echo $FRONTEND_URL | sed 's|https://||')" \
        --timeout=10s \
        --period=60s || echo "Uptime check may already exist"
    
    echo -e "${GREEN}✅ Monitoring configured${NC}"
}

# Function to display deployment summary
show_summary() {
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "=================================="
    echo -e "${BLUE}Frontend URL:${NC} $FRONTEND_URL"
    echo -e "${BLUE}Backend URL:${NC} $BACKEND_URL"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "1. Visit the frontend URL to access your app"
    echo "2. Login as admin: admin@loveconnect.com / admin123"
    echo "3. Configure Agora settings in Admin Dashboard"
    echo "4. Get Agora credentials from: https://console.agora.io/"
    echo "5. Test video calling functionality"
    echo ""
    echo -e "${YELLOW}💡 Important Notes:${NC}"
    echo "• Video calling requires valid Agora credentials"
    echo "• Current implementation uses mock tokens for demo"
    echo "• For production, implement proper Agora token server"
    echo "• Monitor costs in Google Cloud Console"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    check_auth
    create_project
    enable_apis
    deploy_backend
    deploy_frontend
    setup_monitoring
    show_summary
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backend")
        check_auth
        gcloud config set project $PROJECT_ID
        deploy_backend
        ;;
    "frontend")
        check_auth
        gcloud config set project $PROJECT_ID
        deploy_frontend
        ;;
    "help")
        echo "Usage: $0 [deploy|backend|frontend|help]"
        echo ""
        echo "Commands:"
        echo "  deploy    - Deploy both backend and frontend (default)"
        echo "  backend   - Deploy only backend service"
        echo "  frontend  - Deploy only frontend service"
        echo "  help      - Show this help message"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac