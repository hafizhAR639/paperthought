# Development Guide

Guide for developers working on PaperThought.

## Project Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Full page components (routes)
│   ├── services/       # API calls (authService, paperService)
│   ├── hooks/          # Custom React hooks
│   ├── store/          # Zustand state management
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app with routes
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles

backend/
├── src/
│   ├── config/         # Configuration and database setup
│   ├── database/       # Migrations
│   ├── middleware/     # Express middleware
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic (AI, file processing)
│   ├── utils/          # Helpers (JWT, password, response formatting)
│   ├── types/          # TypeScript interfaces
│   ├── app.ts          # Express app configuration
│   └── index.ts        # Entry point
```

## Frontend Development

### Local Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Key Files

- **App.tsx**: Main routing and layout
- **store/authStore.ts**: Authentication state (Zustand)
- **store/paperStore.ts**: Paper management state
- **services/api.ts**: Axios instance with interceptors
- **services/authService.ts**: Auth API calls
- **services/paperService.ts**: Paper API calls

### Adding a New Page

1. Create file in `src/pages/MyPage.tsx`:
```typescript
import { useNavigate } from 'react-router-dom';

export default function MyPage() {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">My Page</h1>
    </div>
  );
}
```

2. Add route in `App.tsx`:
```typescript
<Route path="/my-path" element={<MyPage />} />
```

### Styling

- Uses **Tailwind CSS** for all styling
- Custom classes in `src/index.css`:
  - `.btn-primary` - Primary button
  - `.card` - Card container
  - `.input-field` - Form input
  - `.highlight-*` - Issue highlights

### State Management (Zustand)

```typescript
import { useAuthStore } from '@/store/authStore';

export function Component() {
  const { user, logout } = useAuthStore();
  // Use state...
}
```

### API Calls

```typescript
import { paperService } from '@/services/paperService';

// Upload paper
const paper = await paperService.uploadPaper(title, content);

// Analyze
await paperService.analyzePaper(paperId);
```

## Backend Development

### Local Setup

```bash
cd backend
npm install
cp .env.example .env

# Edit .env with your keys
# Then run migrations
npm run db:migrate

npm run dev
```

### Database

#### Migrations

Edit `src/database/migrate.ts` to add/modify tables:

```typescript
const migrations = [
  `CREATE TABLE IF NOT EXISTS my_table (
    id VARCHAR(36) PRIMARY KEY,
    content TEXT NOT NULL
  );`,
];
```

Run migrations:
```bash
npm run db:migrate
```

#### Querying

Use the pool directly:
```typescript
import { pool } from '../config/database.js';

const result = await pool.query(
  'SELECT * FROM papers WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
  [userId]
);
```

### Adding a New Route

1. Create route file `src/routes/myroute.ts`:
```typescript
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    // Your logic here
    successResponse(res, { data: 'value' });
  } catch (error) {
    errorResponse(res, 'Error message');
  }
});

export default router;
```

2. Import in `src/routes/index.ts`:
```typescript
import myRoute from './myroute.js';
router.use('/myroute', myRoute);
```

### API Response Format

Always use response utilities:
```typescript
import { successResponse, errorResponse } from '../utils/response.js';

// Success
successResponse(res, { id: 123 }, 'Created successfully', 201);

// Error
errorResponse(res, 'User not found', 404);
```

### Authentication

Protect routes with middleware:
```typescript
router.get('/protected', authMiddleware, async (req, res) => {
  // req.userId and req.user are available
  if (!req.userId) {
    return errorResponse(res, 'Unauthorized', 401);
  }
});
```

### AI Integration

Using Gemini for analysis:
```typescript
import { analyzeTextWithGemini } from '../services/aiService.js';

const analysis = await analyzeTextWithGemini(paragraphText, paperTitle);
// Returns: { citation_score, coherence_score, ..., issues[] }
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=PaperThought
```

### Backend (.env)
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/paperthought
JWT_SECRET=dev-secret-key
GEMINI_API_KEY=your-key
GROQ_API_KEY=your-key
HUGGINGFACE_API_KEY=your-key
```

## Testing

### Frontend Unit Tests
```bash
cd frontend
npm test
```

### Backend API Tests
```bash
cd backend
npm test

# Test specific endpoint
npm test -- auth.test.ts
```

### Manual API Testing

Using curl:
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass","fullName":"Test"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}'

# Use token
TOKEN="eyJhbGciOi..."
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

## Code Style

### Frontend
- Components: PascalCase (`MyComponent.tsx`)
- Functions/hooks: camelCase (`usePaperData()`)
- Files: PascalCase for components, camelCase for utilities
- Use **Tailwind classes** for styling, avoid CSS files

### Backend
- Files: camelCase (`authService.ts`)
- Functions: camelCase (`analyzeText()`)
- Classes: PascalCase (`GeminiService`)
- Use **TypeScript strict mode**

## Common Tasks

### Add a new Zustand store
```typescript
// src/store/myStore.ts
import { create } from 'zustand';

interface MyState {
  data: any[];
  setData: (data: any[]) => void;
}

export const useMyStore = create<MyState>((set) => ({
  data: [],
  setData: (data) => set({ data }),
}));
```

### Add API endpoint
```typescript
// 1. Create route in src/routes/myroute.ts
router.post('/action', authMiddleware, async (req, res) => {
  // Implementation
});

// 2. Import in src/routes/index.ts
import myRoute from './myroute.js';
router.use('/myroute', myRoute);

// 3. Call from frontend
const result = await apiClient.post('/myroute/action', { data });
```

### Handle errors
```typescript
// Backend
try {
  // Do something
} catch (error: any) {
  console.error('Error:', error);
  if (error.code === '23505') {  // Unique constraint
    return errorResponse(res, 'Already exists', 409);
  }
  errorResponse(res, 'Server error');
}

// Frontend
try {
  await paperService.uploadPaper(title, content);
} catch (error: any) {
  const message = error.response?.data?.error || 'Failed';
  setError(message);
}
```

## Performance Tips

### Frontend
- Lazy load pages: `const Page = lazy(() => import('./Page.tsx'))`
- Memoize components: `memo(MyComponent)`
- Use proper key in lists
- Debounce search/filters

### Backend
- Index frequently queried columns
- Use connection pooling (already configured)
- Cache API responses (coming soon)
- Implement pagination for large datasets

## Debugging

### Frontend
```bash
# DevTools
- Chrome DevTools (F12)
- React DevTools extension
- Redux DevTools for Zustand (if needed)

# Logging
console.log('debug:', value);
```

### Backend
```bash
# Logging
console.log('Debug:', value);
console.error('Error:', error);

# Node Inspector
node --inspect-brk dist/src/index.js
# Then open chrome://inspect

# Database
psql paperthought
SELECT * FROM papers;
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: add my feature"

# Push and create PR
git push origin feature/my-feature
```

## Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## Support

- 📖 Full documentation: [README.md](../README.md)
- 🚀 Deployment: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🐛 Issues: Open GitHub issue
- 💬 Questions: Create discussion
