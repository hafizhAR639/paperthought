# Deployment Guide

Instructions for deploying PaperThought to production.

## Prerequisites

- Git account with repository push access
- Cloud provider accounts (choose one):
  - **Frontend**: Vercel, Netlify, or Cloudflare Pages
  - **Backend**: Railway, Render, Fly.io, or Heroku
  - **Database**: Neon (PostgreSQL), Supabase, or ElephantSQL
- Domain name (optional but recommended)

## Recommended Stack

For fastest setup with free tier:

| Component | Service | Free Tier | Notes |
|-----------|---------|-----------|-------|
| Frontend | Vercel | Unlimited | Git integrated |
| Backend | Railway | 500 hrs/mo | Simple deployment |
| Database | Neon | 10GB storage | PostgreSQL with pgvector |
| Storage | Cloudinary | 25GB | Image/file hosting |

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/paperthought.git
git push -u origin main
```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select GitHub repo
   - Set root directory: `frontend`
   - Add environment variables:
     ```
     VITE_API_URL=https://your-backend-url/api
     ```
   - Deploy

3. **Custom Domain** (optional)
   - Vercel > Settings > Domains
   - Add your domain and update DNS records

### Option 2: Netlify

1. **Build and deploy**
```bash
cd frontend
npm run build
```

2. **Drag & drop**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Drag `frontend/dist` folder
   - Or connect GitHub for auto-deploy

3. **Environment variables**
   - Netlify > Site settings > Build & deploy
   - Add `VITE_API_URL=https://your-backend-url/api`

### Option 3: Cloudflare Pages

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy frontend/dist
```

## Backend Deployment

### Option 1: Railway (Recommended)

1. **Prepare for deployment**
```bash
cd backend
npm run build
```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "GitHub Repo"
   - Configure:
     - Root directory: `backend`
     - Build command: `npm run build`
     - Start command: `node dist/src/index.js`

3. **Environment variables**
   - Railway > Project > Variables
   - Add all from `.env`:
     ```
     PORT=5000
     NODE_ENV=production
     DATABASE_URL=your-postgres-url
     JWT_SECRET=generate-random-string
     GEMINI_API_KEY=your-key
     GROQ_API_KEY=your-key
     HUGGINGFACE_API_KEY=your-key
     ```

4. **Run migrations**
   - Railway > Deployments
   - Create new environment with:
     ```
     npm run db:migrate
     ```

### Option 2: Render

1. **Create new Web Service on [render.com](https://render.com)**
   - Connect GitHub repo
   - Build command: `npm run build --workspace=backend`
   - Start command: `node backend/dist/src/index.js`
   - Add environment variables
   - Deploy

### Option 3: Fly.io

```bash
npm install -g flyctl
cd backend
flyctl launch
# Follow prompts
flyctl deploy
```

## Database Deployment

### Option 1: Neon (Recommended)

1. **Create project on [neon.tech](https://neon.tech)**
   - New project > Select region
   - Get connection string

2. **Run migrations**
```bash
# Update DATABASE_URL with Neon URL
DATABASE_URL="postgresql://..." npm run db:migrate
```

3. **Update backend**
   - Set `DATABASE_URL` environment variable to Neon URL

### Option 2: Supabase

1. **Create project on [supabase.com](https://supabase.com)**
   - New project > Select region
   - Get PostgreSQL connection string

2. **Enable pgvector**
   - Supabase > SQL Editor
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`

3. **Run migrations with Supabase URL**

### Option 3: ElephantSQL (Limited free tier)

1. **Create instance on [elephantsql.com](https://www.elephantsql.com)**
   - Tiny Turtle (20MB) free tier
   - Get connection string

2. **Run migrations**
   - Limited space, suitable for testing only

## Environment Variables Checklist

### Backend Production

```bash
# Application
PORT=5000
NODE_ENV=production

# Database (from Neon/Supabase)
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# Security
JWT_SECRET=<generate-random-64-char-string>

# APIs (get from providers)
GEMINI_API_KEY=<your-gemini-key>
GROQ_API_KEY=<your-groq-key>
HUGGINGFACE_API_KEY=<your-huggingface-key>

# Storage
FILE_STORAGE_PATH=/tmp/uploads
MAX_FILE_SIZE=10485760
```

### Frontend Production

```bash
VITE_API_URL=https://your-backend-domain/api
VITE_APP_NAME=PaperThought
```

## SSL/HTTPS

All major providers handle SSL automatically:
- ✅ Vercel: Auto SSL
- ✅ Netlify: Auto SSL
- ✅ Railway: Auto SSL
- ✅ Render: Auto SSL

## Custom Domain

### Vercel
```
1. Vercel > Project > Settings > Domains
2. Add domain
3. Update DNS records (shown in Vercel)
```

### Netlify
```
1. Netlify > Site settings > Domain settings
2. Update nameservers at domain registrar
```

## Monitoring & Logging

### Railway
```
Railway > Project > Logs
- Monitor application logs
- Check memory/CPU usage
- Restart deployments
```

### Render
```
Render > Service > Logs
- Real-time logs
- Deployment history
- Metrics
```

## Database Backups

### Neon
```
Neon Console > Backups
- Automatic daily backups
- 7-day retention
- Point-in-time recovery available
```

### Supabase
```
Supabase > Settings > Backups
- Daily backups
- 7-day retention
- Manual backups available
```

## Scale & Performance

### When to optimize:
- Users > 100/mo
- Response time > 2s
- Database queries > 10s

### Optimization steps:
1. Add database indexes
2. Implement caching (Redis)
3. Use CDN for static assets
4. Enable pagination
5. Optimize API responses

### Example index:
```sql
CREATE INDEX idx_papers_user_id ON papers(user_id);
CREATE INDEX idx_paragraphs_version_id ON paragraphs(version_id);
```

## Monitoring

### Tools

**Application Performance**
- Railway Dashboard
- Render Dashboard
- Sentry (error tracking)

**Uptime Monitoring**
- UptimeRobot (free)
- Statuspage.io

**Analytics**
- Google Analytics (frontend)
- Custom logging (backend)

## Troubleshooting

### Database Connection Error
```bash
# Check connection string
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Test locally first
psql $DATABASE_URL -c "SELECT 1"

# Whitelist IP if needed (railway/render shows IP)
```

### Build Fails
```bash
# Clear build cache on Railway/Render
# Usually automatic on re-deploy

# Or rebuild:
git commit --allow-empty -m "Trigger rebuild"
git push
```

### "Module not found" error
```bash
# Update build command to include workspaces
npm install --workspaces
npm run build --workspace=backend
```

### Gemini API Rate Limited
```
Use alternative providers:
- Groq (30 req/min, instant)
- Together.ai for load balancing
- Implement caching for repeated queries
```

## Cost Estimation

**Monthly costs** (100 active users):

| Service | Cost | Notes |
|---------|------|-------|
| Frontend (Vercel) | $0 | Free tier sufficient |
| Backend (Railway) | $5-10 | Pro plan if exceeds 500h/mo |
| Database (Neon) | $0-15 | Free 10GB, Pro $15/mo for more |
| Storage (Cloudinary) | $0 | Free 25GB tier |
| **Total** | **$5-25** | Scales with use |

**Premium requirements** (1000+ users):
- Railway Pro: $15/mo
- Neon Pro: $15/mo  
- Cloudinary: $50/mo
- CDN: $5-20/mo
- **Total**: ~$85/mo

## Going Live Checklist

- [ ] Set NODE_ENV=production
- [ ] Generate secure JWT_SECRET
- [ ] Enable CORS for your domain
- [ ] Setup SSL certificates (auto)
- [ ] Run database migrations
- [ ] Test all API endpoints
- [ ] Setup error logging (Sentry)
- [ ] Monitor database performance
- [ ] Configure email notifications
- [ ] Setup uptime monitoring
- [ ] Document deployment process
- [ ] Create rollback procedure
- [ ] Setup continuous deployment
- [ ] Enable rate limiting
- [ ] Add database backups
- [ ] Test disaster recovery

## Post-Deployment

1. **Monitor**
   - Check logs daily first week
   - Monitor database size
   - Track API response times

2. **Update**
   - Pull latest code weekly
   - Update dependencies monthly
   - Security patches immediately

3. **Optimize**
   - After 100 users: add indexes
   - After 1000 users: implement caching
   - Monitor costs regularly

## Support & Help

- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Neon Docs](https://neon.tech/docs/)
- [Vercel Docs](https://vercel.com/docs)

Questions? Open GitHub issue or email support@paperthought.app
