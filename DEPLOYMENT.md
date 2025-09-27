# 🚀 FixNow Deployment Guide

## Quick Deploy to GitHub Pages

### 1. **Frontend Deployment (GitHub Pages)**

The frontend will automatically deploy to GitHub Pages when you push to main branch.

**Live URL**: https://rafaelmaranon.github.io/FixNow

### 2. **Backend Deployment Options**

#### Option A: Render (Recommended)
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service
4. Set build command: `cd backend && npm install`
5. Set start command: `cd backend && npm start`
6. Set environment variables:
   ```
   NODE_ENV=production
   PORT=10000
   AGENT_MODE=inkeep
   ```

#### Option B: Railway
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repo
3. Deploy backend folder
4. Set environment variables

#### Option C: Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Set root directory to `backend`
4. Deploy

### 3. **Environment Configuration**

The frontend automatically detects the environment:

- **Development**: Uses `http://localhost:3001`
- **Production**: Uses `https://fixnow-backend.onrender.com` (or your deployed backend URL)

To use a custom backend URL, set:
```bash
REACT_APP_API_URL=https://your-backend-url.com
```

### 4. **Manual Deployment Steps**

```bash
# 1. Build frontend
cd frontend/contractor-map
npm install
npm run build

# 2. Deploy backend (example for Render)
# - Push to GitHub
# - Render will auto-deploy from main branch

# 3. Update API URL if needed
# Set REACT_APP_API_URL in GitHub Actions secrets
```

### 5. **GitHub Actions Workflow**

The `.github/workflows/deploy.yml` automatically:
- Builds the React app
- Deploys to GitHub Pages
- Uses production API URL

### 6. **Custom Domain (Optional)**

To use a custom domain:
1. Update `CNAME` file with your domain
2. Configure DNS to point to GitHub Pages
3. Enable HTTPS in GitHub Pages settings

## 🎯 Production URLs

- **Frontend**: https://rafaelmaranon.github.io/FixNow
- **Backend**: https://fixnow-backend.onrender.com (deploy to get this URL)

## 🔧 Troubleshooting

### CORS Issues
If you get CORS errors, update backend `server.js`:
```javascript
app.use(cors({
  origin: ['https://rafaelmaranon.github.io', 'http://localhost:3000'],
  credentials: true
}));
```

### API Connection Issues
Check that:
1. Backend is deployed and running
2. API_BASE_URL is correct in frontend
3. Environment variables are set properly

## 🏆 Demo Ready!

Once deployed, your FixNow app will be live and accessible to hackathon judges at:
**https://rafaelmaranon.github.io/FixNow**
