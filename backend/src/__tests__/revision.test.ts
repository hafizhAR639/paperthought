import { pool } from '../config/database';
import {
  setupTestDatabase,
  clearTestDatabase,
  createTestUser,
  createTestPaper,
  createTestParagraphs,
} from './helpers';

describe('Paragraph Revision MVP', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Revision Save and Persistence', () => {
    test('should save revised text to database', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);
      const revisedText = 'This is the revised version of the paragraph with improvements.';

      // Simulate save revision endpoint
      await pool.query(
        `UPDATE paragraphs SET revised_text = $1 WHERE id = $2`,
        [revisedText, paragraphs[0].id],
      );

      // Fetch and verify persistence
      const result = await pool.query(
        `SELECT revised_text FROM paragraphs WHERE id = $1`,
        [paragraphs[0].id],
      );

      expect(result.rows[0].revised_text).toBe(revisedText);
    });

    test('should not overwrite original text on revision', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);
      const originalText = paragraphs[0].originalText;
      const revisedText = 'Updated text here.';

      await pool.query(
        `UPDATE paragraphs SET revised_text = $1 WHERE id = $2`,
        [revisedText, paragraphs[0].id],
      );

      const result = await pool.query(
        `SELECT original_text, revised_text FROM paragraphs WHERE id = $1`,
        [paragraphs[0].id],
      );

      expect(result.rows[0].original_text).toBe(originalText);
      expect(result.rows[0].revised_text).toBe(revisedText);
      expect(result.rows[0].original_text).not.toBe(result.rows[0].revised_text);
    });

    test('should allow updating revision multiple times', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);

      const revisions = [
        'First revision',
        'Second revision',
        'Third revision',
      ];

      for (const revisedText of revisions) {
        await pool.query(
          `UPDATE paragraphs SET revised_text = $1 WHERE id = $2`,
          [revisedText, paragraphs[0].id],
        );
      }

      const result = await pool.query(
        `SELECT revised_text FROM paragraphs WHERE id = $1`,
        [paragraphs[0].id],
      );

      expect(result.rows[0].revised_text).toBe(revisions[revisions.length - 1]);
    });

    test('should return revised text when fetching paragraph for editing', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);
      const revisedText = 'Edited version of this paragraph.';

      await pool.query(
        `UPDATE paragraphs SET revised_text = $1 WHERE id = $2`,
        [revisedText, paragraphs[0].id],
      );

      // Simulate fetching paragraph for revision page
      // Should return revised_text if available
      const result = await pool.query(
        `SELECT original_text, revised_text FROM paragraphs WHERE id = $1`,
        [paragraphs[0].id],
      );

      const textToDisplay = result.rows[0].revised_text ?? result.rows[0].original_text;
      expect(textToDisplay).toBe(revisedText);
    });

    test('should display original text if no revision exists', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);
      const originalText = paragraphs[0].originalText;

      // Fetch without revision
      const result = await pool.query(
        `SELECT original_text, revised_text FROM paragraphs WHERE id = $1`,
        [paragraphs[0].id],
      );

      const textToDisplay = result.rows[0].revised_text ?? result.rows[0].original_text;
      expect(textToDisplay).toBe(originalText);
      expect(result.rows[0].revised_text).toBeNull();
    });
  });

  describe('Revision After Exiting and Re-entering', () => {
    test('should preserve revision when user exits and re-enters paper', async () => {
      const user = await createTestUser();
      const { versionId, paperId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);
      const revisedText = 'Permanent revision that survives page exit.';

      // User saves revision
      await pool.query(
        `UPDATE paragraphs SET revised_text = $1 WHERE id = $2`,
        [revisedText, paragraphs[0].id],
      );

      // User exits page (simulate logout/navigation away)
      // User re-enters paper view
      const reloadResult = await pool.query(
        `SELECT original_text, revised_text FROM paragraphs WHERE id = $1`,
        [paragraphs[0].id],
      );

      const textToDisplay = reloadResult.rows[0].revised_text ?? reloadResult.rows[0].original_text;
      expect(textToDisplay).toBe(revisedText);
    });
  });

  describe('Revision Status Tracking', () => {
    test('should track paragraph revision status', async () => {
      const user = await createTestUser();
      const { versionId } = await createTestPaper(user.id);
      const paragraphs = await createTestParagraphs(versionId, 1);

      // Initially should be pending
      let result = await pool.query(`SELECT status FROM paragraphs WHERE id = $1`, [
        paragraphs[0].id,
      ]);
      expect(['pending', 'needs_revision']).toContain(result.rows[0].status);

      // After revision, can mark as approved
      await pool.query(
        `UPDATE paragraphs SET revised_text = $1, status = $2 WHERE id = $3`,
        ['Revised text', 'approved', paragraphs[0].id],
      );

      result = await pool.query(`SELECT status FROM paragraphs WHERE id = $1`, [
        paragraphs[0].id],
      );
      expect(result.rows[0].status).toBe('approved');
    });
  });
});
