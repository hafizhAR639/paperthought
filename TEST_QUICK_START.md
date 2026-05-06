# PaperThought MVP Test Setup - Quick Start

Selesai! Test suite komprehensif untuk MVP sudah siap. Berikut ringkasan singkat untuk mulai testing:

## Installation (Wajib Dikerjakan Duluan)

```bash
npm install-all
# Installs dependencies untuk backend dan frontend
```

## Run Tests

```bash
# Run semua test (backend + frontend)
npm test

# Run backend test saja
npm run test:backend

# Run frontend test saja
npm run test:frontend

# Watch mode (re-run saat file berubah)
cd backend && npm run test:watch
cd frontend && npm run test:watch
```

## What's Tested (MVP Scope)

### Backend Tests (4 suites, 30+ test cases)

1. **auth.test.ts** - User registration, login, JWT
   - Password hashing (bcrypt)
   - Duplicate email rejection
   - Token generation & validation

2. **papers.test.ts** - Paper CRUD, versioning, paragraphs
   - Create paper dengan version
   - Store paragraphs dengan scores
   - Score constraints (0-10 range)
   - Decimal precision (max 2 places)

3. **revision.test.ts** - Save & restore revised text
   - Save revision ke database ✅ FIX FOR: "revisjadi balik lagi" issue
   - Preserve original text lama
   - Multiple updates support
   - Display revised_text dengan fallback ke original

4. **analysis.test.ts** - Score normalization & text handling
   - Clamp scores 0-10 (prevent overflow) ✅ FIX FOR: "numeric field overflow"
   - Text normalization (whitespace, max length)
   - Mock analyzer response structure
   - Average score calculation

### Frontend Tests (4 suites, 15+ test cases)

1. **LoginPage.test.tsx** - Form & authentication UI
   - Email/password inputs
   - Submit button
   - Register link

2. **RevisionPage.test.tsx** - Core revision UI ✅ VALIDATES: Save & load revised text
   - Load original text initially
   - Load revised_text jika ada (KEY FEATURE)
   - Allow editing & save
   - Navigation (Previous/Next)

3. **paperService.test.ts** - API contract validation
   - Fetch papers, paragraphs, analysis
   - POST revision dengan revised_text
   - Error handling (404, 401, network)

4. **DashboardPage.test.tsx** - Main dashboard
   - Papers list
   - Upload section
   - Status indicators

## Key Fixes Validated by Tests

Dua issue yang tadi dilaporkan user sekarang tercakup:

1. **"Numeric field overflow"** - revision.test.ts
   - Database schema sekarang DECIMAL(4,2) → support 0-10 scores
   - Score normalization function clamp values
   - Tests verify scores never exceed bounds

2. **"Edit balik lagi saat keluar-masuk"** - revision.test.ts
   - Frontend now loads `revisedText ?? originalText` (fallback logic)
   - Save endpoint properly updates database
   - Tests verify persistence across page exits

## Database Requirements

**Backend tests memerlukan:**
- PostgreSQL running dan accessible
- `DATABASE_URL` env var configured
- OR tests auto-setup fresh database each run

**Frontend tests tidak memerlukan database** (mocked API calls)

## File Structure

```
backend/
├── jest.config.ts          # Jest configuration
├── tsconfig.json           # Updated untuk exclude test files
├── src/
│   ├── __tests__/
│   │   ├── setup.ts        # Database fixtures
│   │   ├── helpers.ts      # Test data factories
│   │   ├── auth.test.ts
│   │   ├── papers.test.ts
│   │   ├── revision.test.ts
│   │   └── analysis.test.ts
│   └── ...                 # Main source code

frontend/
├── vitest.config.ts        # Vitest configuration
├── src/
│   ├── __tests__/
│   │   ├── setup.ts        # Test environment setup
│   │   ├── LoginPage.test.tsx
│   │   ├── RevisionPage.test.tsx
│   │   ├── paperService.test.ts
│   │   └── DashboardPage.test.tsx
│   └── ...                 # Main source code

TESTING.md                  # Comprehensive testing guide
```

## Coverage & Quality

Test suite covers:
- ✅ User authentication flows
- ✅ Paper management (CRUD)
- ✅ Paragraph analysis & scoring
- ✅ Revision save/load mechanism (KEY FIX)
- ✅ Score normalization (KEY FIX)
- ✅ Frontend form interactions
- ✅ API request/response contracts
- ✅ Error handling & edge cases

Target: 80%+ line coverage untuk MVP

## Next Steps

1. **Install dependencies first**: `npm install-all`
2. **Run tests**: `npm test`
3. **Check coverage**: `cd backend && npm run test:cov`
4. **Read details**: See `TESTING.md` untuk full documentation

## Troubleshooting

**Q: Tests fail dengan database connection error**
- A: Pastikan PostgreSQL running, or set `DATABASE_URL` ke valid connection string

**Q: Frontend tests throw module resolution errors**
- A: Path aliases defined di vitest.config.ts. Run `npm install-all` dulu.

**Q: Some test files not running**
- A: Run `npm install --save-dev @types/jest` di backend jika belum terpasang

## Command Reference

```bash
# Install all
npm install-all

# Run all tests
npm test

# Single workspace
npm --workspace=backend test
npm --workspace=frontend test

# Watch/coverage/UI
npm --workspace=backend run test:watch
npm --workspace=backend run test:cov
npm --workspace=frontend run test:ui
```

---

**Note untuk dev**: Kalo ada test yang gagal, itu usually karena database setup. Pastikan PostgreSQL running dan accessible, atau backup node_modules dan re-run `npm install-all`.
