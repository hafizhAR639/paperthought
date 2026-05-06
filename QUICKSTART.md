# PaperThought - Quick Start Guide

Get up and running with PaperThought in 5 minutes.

## Prerequisites

- **Node.js 18+**: [Download](https://nodejs.org/)
- **PostgreSQL 14+** or Docker: [Download Docker](https://docker.com/get-docker)
- **Git**: [Download](https://git-scm.com/)

## Installation

### 1. Clone and Setup

```bash
# Clone repository (or extract from archive)
cd PaperThought

# Run setup script (Linux/Mac)
chmod +x setup.sh
./setup.sh

# Or manually on Windows
npm install --workspaces
cp backend\.env.example backend\.env
cp frontend\.env.example frontend\.env
```

### 2. Configure Environment

Edit `backend/.env`:
```bash
# Required: Get free keys from:
# - Gemini: https://ai.google.dev/
# - Groq: https://console.groq.com/
# - HuggingFace: https://huggingface.co/settings/tokens

GEMINI_API_KEY=your-key-here
GROQ_API_KEY=your-key-here
HUGGINGFACE_API_KEY=your-key-here
JWT_SECRET=change-this-to-random-string
DATABASE_URL=postgresql://postgres:password@localhost:5432/paperthought
```

### 3. Start PostgreSQL

```bash
# Option A: Using Docker (recommended)
docker-compose up -d

# Option B: Using local PostgreSQL
createdb paperthought
```

### 4. Run Migrations

```bash
cd backend
npm run db:migrate
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## First Steps

1. **Create Account**
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Register with email and password

2. **Upload Paper**
   - Click "Upload Paper"
   - Enter title and paste paper content
   - Click "Upload & Analyze"

3. **Analyze**
   - Click "Run Analysis"
   - Wait for AI analysis to complete
   - View scores and issues

4. **Revise**
   - Click "Start Revision"
   - Edit problematic paragraphs
   - Watch scores improve (coming soon)

## Testing API

### Using curl

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (replace TOKEN with JWT from login)
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Import API collection from `docs/api-collection.json`
2. Set `{{base_url}}` to `http://localhost:3001`
3. Run requests with authentication

## Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
docker ps  # Should show postgres container

# Or manually start PostgreSQL
docker-compose up -d

# Check connection string in backend/.env
```

### "Gemini API error"
```bash
# Verify API key is set
echo $GEMINI_API_KEY

# Check quota at https://ai.google.dev/
# Free tier: 60 requests/minute
```

### "Port 3000 already in use"
```bash
# Change frontend port in vite.config.ts
# server: { port: 3001 }

# Or kill existing process
lsof -i :3000
kill -9 <PID>
```

### "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --workspaces

# Clear build cache
rm -rf backend/dist frontend/dist
```

## Development Commands

### Backend
```bash
npm --workspace=backend run dev      # Start dev server
npm --workspace=backend run build    # Build for production
npm --workspace=backend run lint     # Check code style
npm --workspace=backend run db:migrate # Run migrations
```

### Frontend
```bash
npm --workspace=frontend run dev     # Start dev server
npm --workspace=frontend run build   # Build for production
npm --workspace=frontend run lint    # Check code style
```

## Project Structure

```
PaperThought/
├── backend/          # Express.js API
├── frontend/         # React + Vite UI
├── docker-compose.yml # PostgreSQL setup
├── package.json      # Monorepo config
└── README.md         # Full documentation
```

## Next Steps

- [Full Documentation](README.md)
- [API Reference](docs/API.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing](docs/CONTRIBUTING.md)

## Support

- 📖 Documentation: See [README.md](README.md)
- 🐛 Found a bug? Open an issue
- 💡 Have an idea? Start a discussion
- 📧 Contact: support@paperthought.app

## License

MIT License - See LICENSE for details
