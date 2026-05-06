# PaperThought MVP Test Suite

Comprehensive test suite untuk validasi fitur-fitur MVP PaperThought, mencakup:
- **Authentication**: User registration, login, JWT validation
- **Paper Management**: Create, fetch, store paragraphs dengan scores
- **Revision System**: Save dan restore revised text dengan persistence
- **Analysis Service**: Score normalization, overflow prevention, mock analyzer

## Setup & Installation

### Install All Dependencies (Required First)

```bash
npm install-all
# or
npm install --workspaces
```

## Running Tests

### Run All Tests (Backend + Frontend)
```bash
npm test
```

### Run Backend Tests Only
```bash
npm run test:backend
# or
cd backend && npm test
```

### Run Frontend Tests Only
```bash
npm run test:frontend
# or
cd frontend && npm test
```

### Watch Mode (re-run on file changes)
```bash
# Backend
cd backend && npm run test:watch

# Frontend
cd frontend && npm run test:watch
```

### Coverage Reports
```bash
# Backend coverage
cd backend && npm run test:cov

# Frontend coverage
cd frontend && npm run test:cov
```

## Test Structure

### Backend Tests (Jest)

Located in `backend/src/__tests__/`

1. **auth.test.ts**
   - User registration dengan hash password
   - Login verification dengan bcrypt
   - JWT token generation dan validation
   - Duplicate email rejection
   - Expired token detection

2. **papers.test.ts**
   - Paper creation per user
   - Paper version initialization
   - Multiple papers support
   - Paragraph ordering dan initial state
   - Analysis results storage
   - Score range constraints (0-10)
   - Decimal precision handling (max 2 places)

3. **revision.test.ts**
   - Save revised text to database
   - Preserve original text lama
   - Multiple revision updates
   - Fetch revised_text with fallback to original
   - Persistence saat exit/re-enter paper
   - Status tracking (pending → approved)

4. **analysis.test.ts**
   - Score normalization (clamp 0-10)
   - Text whitespace normalization
   - Maximum character limit enforcement
   - Word counting accuracy
   - Mock analyzer response structure
   - Average score calculation within bounds
   - Issue detection untuk low scores

### Frontend Tests (Vitest)

Located in `frontend/src/__tests__/`

1. **LoginPage.test.tsx**
   - Form rendering dengan email/password inputs
   - Submit button presence
   - Register link display
   - Input value acceptance
   - Keyboard accessibility
   - Form validation triggers

2. **RevisionPage.test.tsx**
   - Textarea rendering untuk edit
   - Score display (Citation, Coherence, Alignment, Research Gap)
   - Load original text initially
   - Show revised_text jika ada
   - Allow text editing
   - Save button (disabled/enabled based on changes)
   - Navigation buttons (Previous/Next)
   - Paragraph counter
   - Back to Analysis button

3. **paperService.test.ts**
   - Fetch papers list
   - Fetch paper details
   - Fetch paragraphs dengan revised_text
   - Fetch analysis results
   - POST revised text to API
   - Request body validation
   - Error handling (Network, 404, 401)

4. **DashboardPage.test.tsx**
   - Dashboard title rendering
   - Papers list display
   - Upload/Create paper section
   - Paper status indicators
   - Analysis progress display
   - Logout/Settings option

## Database Setup for Testing

Backend tests automatically:
1. Clear test tables sebelum setiap test
2. Create fresh tables dengan schema
3. Insert test data menggunakan helpers

**Note**: Tests menggunakan test database connection. Pastikan `DATABASE_URL` env var valid, atau tests akan fail saat setup.

## Test Helpers & Utilities

### Backend (`backend/src/__tests__/helpers.ts`)

```typescript
// User creation
const user = await createTestUser(email, password, fullName);

// Paper creation
const { paperId, versionId } = await createTestPaper(userId);

// Paragraph creation
const paragraphs = await createTestParagraphs(versionId, count);

// Analysis results
const results = await createTestAnalysisResults(paragraphId, count);

// JWT generation
const token = generateTestJWT(userId, expiresIn);
```

### Database Utilities

```typescript
await setupTestDatabase();    // Setup fresh tables
await clearTestDatabase();    // Clear data
await teardownTestDatabase(); // Cleanup
```

## Key Testing Patterns

### 1. Authentication Flow
```typescript
// Register user
const user = await createTestUser();

// Verify password hash
const passwordMatch = await bcrypt.compare(password, hash);

// Generate & verify JWT
const token = generateTestJWT(userId);
const decoded = jwt.verify(token, secret);
```

### 2. Revision Persistence
```typescript
// Save revision
await pool.query(
  `UPDATE paragraphs SET revised_text = $1 WHERE id = $2`,
  [revisedText, paragraphId]
);

// Fetch with fallback to original
const text = result.revised_text ?? result.original_text;
```

### 3. Score Normalization
```typescript
// All scores clamped 0-10
const normalized = Math.max(0, Math.min(10, score));

// Average calculation
const avgScore = (s1 + s2 + s3 + s4) / 4; // Always 0-10
```

### 4. Frontend Component Testing
```typescript
// Mock hooks
vi.mock('@/hooks/usePaperData', () => ({
  usePaperData: () => mockPaperData
}));

// Mock services
vi.mock('@/services/paperService');

// Render with router
const renderWithRouter = (component) => 
  render(<BrowserRouter>{component}</BrowserRouter>);
```

## Coverage Targets for MVP

Current test suite covers:
- ✅ Auth registration & login paths
- ✅ Paper CRUD & versioning
- ✅ Paragraph management & scoring
- ✅ Revision save/restore mechanism
- ✅ Score overflow prevention
- ✅ Text normalization & validation
- ✅ Frontend form inputs & navigation
- ✅ API request/response contracts
- ✅ Error handling & edge cases

## Troubleshooting

### Backend Tests Fail: "connect ECONNREFUSED"
**Solution**: Pastikan PostgreSQL running dan `DATABASE_URL` env var benar

```bash
# Check connection
npm --workspace=backend run db:migrate
```

### Frontend Tests Fail: "Cannot find module '@/utils/api'"
**Solution**: Path alias sudah defined di `vitest.config.ts`. Pastikan types correct.

### Tests Timeout
**Solution**: Increase timeout di config atau specific test:
```typescript
test('slow test', async () => {
  // test code
}, 30000); // 30 seconds
```

## CI/CD Integration

Untuk GitHub Actions atau similar:

```yaml
- name: Install dependencies
  run: npm install-all

- name: Backend tests
  run: npm run test:backend -- --coverage

- name: Frontend tests
  run: npm run test:frontend -- --coverage

- name: Archive coverage
  uses: codecov/codecov-action@v3
```

## Next Steps

Setelah MVP testing:
1. Add E2E tests (Playwright/Cypress) untuk full user flows
2. Add performance tests untuk analysis accuracy
3. Add integration tests untuk API endpoints
4. Setup code coverage tracking (>80% target)
5. Add mutation testing untuk verify test quality
