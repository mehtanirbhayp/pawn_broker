# Deployment Guide - Pawn Broker System

This guide covers free deployment options for your Node.js/Express application with SQLite database.

## 🚀 Recommended Free Hosting Options

### 1. **Render** (Best Overall - Recommended)

**Why Render?**
- ✅ Free tier with persistent disk storage (perfect for SQLite)
- ✅ Automatic HTTPS
- ✅ Easy Git integration
- ✅ Automatic deployments
- ⚠️ Spins down after 15 min inactivity (wakes on request)

**Deployment Steps:**

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Sign up at [render.com](https://render.com)** (free account)

3. **Create a new Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `pawn-broker-system` (or your choice)
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run init-db`
     - **Start Command**: `npm start`
     - **Plan**: Free

4. **Add Environment Variables** (if needed):
   - `PORT` (usually auto-set, but you can set it)
   - `NODE_ENV=production`

5. **Deploy!**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Your app will be live at `https://your-app-name.onrender.com`

**Important Notes:**
- The database will be created automatically on first run
- Data persists on Render's free tier
- First request after inactivity may take 30-60 seconds (cold start)

---

### 2. **Railway** (Great Alternative)

**Why Railway?**
- ✅ $5 free credit monthly (usually enough for small apps)
- ✅ Persistent storage
- ✅ Very fast deployments
- ✅ Great developer experience

**Deployment Steps:**

1. **Sign up at [railway.app](https://railway.app)** (GitHub login)

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure:**
   - Railway auto-detects Node.js
   - Add build command: `npm install && npm run init-db`
   - Start command: `npm start`

4. **Deploy:**
   - Railway automatically deploys
   - Get your live URL from the project dashboard

**Note:** Railway gives you a custom domain like `your-app.up.railway.app`

---

### 3. **Fly.io** (Good for Global Distribution)

**Why Fly.io?**
- ✅ Free tier with persistent volumes
- ✅ Global edge network
- ✅ Great for production apps

**Deployment Steps:**

1. **Install Fly CLI:**
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Sign up:** `fly auth signup`

3. **Initialize:**
   ```bash
   fly launch
   ```
   - Follow prompts
   - Choose a region
   - Don't deploy a Postgres database (you're using SQLite)

4. **Create a volume for database:**
   ```bash
   fly volumes create data --size 1
   ```

5. **Update fly.toml** (created automatically):
   ```toml
   [mounts]
     source = "data"
     destination = "/app/database"
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

---

### 4. **Cyclic** (Simple Node.js Hosting)

**Why Cyclic?**
- ✅ Free tier
- ✅ Automatic deployments from GitHub
- ✅ Built for Node.js

**Deployment Steps:**

1. **Sign up at [cyclic.sh](https://cyclic.sh)** (GitHub login)

2. **Connect Repository:**
   - Click "New App"
   - Select your GitHub repo
   - Cyclic auto-detects Node.js

3. **Deploy:**
   - Cyclic handles everything automatically
   - Get your URL: `https://your-app.cyclic.app`

**Note:** May need to verify persistent storage support for SQLite

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All sensitive data is in environment variables (not hardcoded)
- [ ] Database initialization script runs on first deploy
- [ ] `.gitignore` excludes `node_modules` and `.env`
- [ ] `package.json` has correct start script
- [ ] Port is configured via `process.env.PORT`

## 🔧 Configuration Updates Needed

Your project is already well-configured! Just ensure:

1. **Database Path**: Already handles directory creation ✅
2. **Port Configuration**: Uses `process.env.PORT || 3000` ✅
3. **Static Files**: Served correctly ✅

## 🗄️ Database Considerations

**SQLite on Free Hosting:**
- ✅ Works great on Render, Railway, Fly.io
- ✅ Data persists on these platforms
- ⚠️ For production with high traffic, consider migrating to PostgreSQL later

**If you need to migrate to PostgreSQL later:**
- Render offers free PostgreSQL
- Railway offers PostgreSQL addon
- Supabase offers free PostgreSQL tier

## 🔒 Security Recommendations

1. **Change default admin credentials** after first deployment
2. **Use environment variables** for sensitive config
3. **Enable HTTPS** (automatic on all recommended platforms)
4. **Consider rate limiting** for production use

## 📊 Monitoring Your Deployment

All platforms provide:
- Deployment logs
- Application logs
- Health check endpoints (you already have `/api/health`)

## 🆘 Troubleshooting

**Database not found errors:**
- Ensure `npm run init-db` runs during build
- Check that database directory is writable

**App not starting:**
- Check logs in platform dashboard
- Verify PORT environment variable
- Ensure all dependencies are in `package.json`

**Slow first request:**
- Normal on free tiers (cold start)
- Consider upgrading to paid tier for always-on

## 💰 Cost Comparison

| Platform | Free Tier | Paid Tier Starts At |
|----------|-----------|---------------------|
| Render   | ✅ Yes (with limits) | $7/month |
| Railway  | ✅ $5 credit/month | $5/month |
| Fly.io   | ✅ Yes (with limits) | Pay-as-you-go |
| Cyclic   | ✅ Yes | $10/month |

## 🎯 Quick Start Recommendation

**For beginners:** Use **Render** - it's the easiest and most straightforward.

**For more control:** Use **Railway** - better developer experience.

**For production:** Consider **Fly.io** or upgrade to paid tier on Render.

---

## Need Help?

- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Fly.io Docs: https://fly.io/docs

