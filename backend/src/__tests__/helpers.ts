import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { config } from '../config/index';

export async function setupTestDatabase() {
  if (pool && typeof pool._setup === 'function') {
    await pool._setup();
  }
}

export async function clearTestDatabase() {
  if (pool && typeof pool._clear === 'function') {
    await pool._clear();
  }
}

export const testUser = {
  id: uuidv4(),
  email: 'test@example.com',
  password: 'TestPassword123!',
  fullName: 'Test User',
  institution: 'Test University',
};

export async function createTestUser(
  email = testUser.email,
  password = testUser.password,
  fullName = testUser.fullName,
) {
  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();

  await pool.query(
    `INSERT INTO users (id, email, password_hash, full_name, institution, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, email, passwordHash, fullName, 'Test University', now, now],
  );

  return { id, email, password, fullName };
}

export function generateTestJWT(userId: string, expiresIn = '24h'): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn });
}

export async function createTestPaper(userId: string, title = 'Test Paper') {
  const paperId = uuidv4();
  const versionId = uuidv4();
  const now = new Date();

  // Create paper
  await pool.query(
    `INSERT INTO papers (id, user_id, title, original_content, current_version_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [paperId, userId, title, 'Test content', versionId, 'draft', now, now],
  );

  // Create paper version
  await pool.query(
    `INSERT INTO paper_versions (id, paper_id, version_number, content, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [versionId, paperId, 1, 'Test content', now],
  );

  return { paperId, versionId };
}

export async function createTestParagraphs(versionId: string, count = 3) {
  const paragraphs = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const paragraphId = uuidv4();
    const text = `This is test paragraph ${i + 1}. It contains sample text for analysis. The paragraph should be analyzed for citation quality, coherence, alignment, and research gap identification.`;

    await pool.query(
      `INSERT INTO paragraphs (id, version_id, paragraph_order, original_text, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [paragraphId, versionId, i, text, 'pending', now],
    );

    paragraphs.push({
      id: paragraphId,
      versionId,
      paragraphOrder: i,
      originalText: text,
      status: 'pending',
    });
  }

  return paragraphs;
}

export async function createTestAnalysisResults(paragraphId: string, count = 2) {
  const results = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const resultId = uuidv4();
    await pool.query(
      `INSERT INTO analysis_results (id, paragraph_id, issue_type, severity, description, suggested_action, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        resultId,
        paragraphId,
        'missing_citation',
        i === 0 ? 'major' : 'minor',
        `Test issue ${i + 1}`,
        `Action for issue ${i + 1}`,
        now,
      ],
    );

    results.push({
      id: resultId,
      paragraphId,
      issueType: 'missing_citation',
      severity: i === 0 ? 'major' : 'minor',
    });
  }

  return results;
}
