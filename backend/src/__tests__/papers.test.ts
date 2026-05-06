import { pool } from '../config/database';
import {
  setupTestDatabase,
  clearTestDatabase,
  createTestUser,
  createTestPaper,
  createTestParagraphs,
  createTestAnalysisResults,
} from './helpers';

describe('Paper Management MVP', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Paper Creation', () => {
    test('should create paper with valid user', async () => {
      const user = await createTestUser();
      const { paperId, versionId } = await createTestPaper(user.id);

      const result = await pool.query(`SELECT id, user_id, title FROM papers WHERE id = $1`, [
        paperId,
      ]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].user_id).toBe(user.id);
      expect(result.rows[0].title).toBe('Test Paper');
    });

    test('should create paper version with initial content', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);

      const result = await pool.query(`SELECT id, version_number FROM paper_versions WHERE id = $1`, [
        versionId,
      ]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].version_number).toBe(1);
    });

    test('should allow multiple papers per user', async () => {
      const user = await createTestUser();
      const paper1 = await createTestPaper(user.id, 'Paper 1');
      const paper2 = await createTestPaper(user.id, 'Paper 2');

      const result = await pool.query(`SELECT id FROM papers WHERE user_id = $1`, [user.id]);

      expect(result.rows.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Paragraph Management', () => {
    test('should create paragraphs for version', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 3);

      const result = await pool.query(
        `SELECT id FROM paragraphs WHERE version_id = $1 ORDER BY paragraph_order ASC`,
        [versionId],
      );

      expect(result.rows).toHaveLength(3);
    });

    test('should retrieve paragraphs with correct order', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      await createTestParagraphs(versionId, 5);

      const result = await pool.query(
        `SELECT paragraph_order FROM paragraphs WHERE version_id = $1 ORDER BY paragraph_order ASC`,
        [versionId],
      );

      expect(result.rows.map((r: any) => r.paragraph_order)).toEqual([0, 1, 2, 3, 4]);
    });

    test('should initialize paragraph with pending status', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);

      const result = await pool.query(`SELECT status FROM paragraphs WHERE id = $1`, [
        paragraphs[0].id,
      ]);

      expect(result.rows[0].status).toBe('pending');
    });

    test('should return zero scores initially', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);

      const result = await pool.query(
        `SELECT citation_score, coherence_score, alignment_score, research_gap_score FROM paragraphs WHERE id = $1`,
        [paragraphs[0].id],
      );

      const scores = result.rows[0];
      expect(parseFloat(scores.citation_score)).toBe(0);
      expect(parseFloat(scores.coherence_score)).toBe(0);
      expect(parseFloat(scores.alignment_score)).toBe(0);
      expect(parseFloat(scores.research_gap_score)).toBe(0);
    });
  });

  describe('Analysis Results', () => {
    test('should create analysis results for paragraph', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);
      const results = await createTestAnalysisResults(paragraphs[0].id, 2);

      const dbResults = await pool.query(
        `SELECT id FROM analysis_results WHERE paragraph_id = $1`,
        [paragraphs[0].id],
      );

      expect(dbResults.rows).toHaveLength(2);
    });

    test('should store issue severity levels', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);
      await createTestAnalysisResults(paragraphs[0].id, 2);

      const result = await pool.query(
        `SELECT severity FROM analysis_results WHERE paragraph_id = $1 ORDER BY created_at ASC`,
        [paragraphs[0].id],
      );

      expect(result.rows[0].severity).toBe('major');
      expect(result.rows[1].severity).toBe('minor');
    });
  });

  describe('Score Constraints (Overflow Prevention)', () => {
    test('should accept scores in valid range 0-10', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);

      const scoreValues = [0, 5, 10];
      for (const score of scoreValues) {
        const now = new Date();
        await pool.query(
          `UPDATE paragraphs SET citation_score = $1, updated_at = $2 WHERE id = $3`,
          [score, now, paragraphs[0].id],
        );

        const result = await pool.query(`SELECT citation_score FROM paragraphs WHERE id = $1`, [
          paragraphs[0].id,
        ]);

        expect(parseFloat(result.rows[0].citation_score)).toBe(score);
      }
    });

    test('should truncate scores with up to 2 decimal places', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);

      const now = new Date();
      await pool.query(
        `UPDATE paragraphs SET citation_score = $1 WHERE id = $2`,
        [7.25, paragraphs[0].id],
      );

      const result = await pool.query(`SELECT citation_score FROM paragraphs WHERE id = $1`, [
        paragraphs[0].id,
      ]);

      expect(parseFloat(result.rows[0].citation_score)).toBe(7.25);
    });
  });
});
