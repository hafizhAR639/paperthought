import express, { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { config } from '../config/index';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { ANALYSIS_LIMITS, PAPER_LIMITS, countWords } from '../services/aiService';
import { runPaperAnalysis } from '../services/analysisService';
import { extractTextFromUploadedFile, inferPaperTitle } from '../utils/textExtraction';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
  },
});

// Upload paper
router.post('/upload', authMiddleware, upload.single('paperFile'), async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const uploadedFile = req.file;
    const rawTitle = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const rawContent = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    let content = rawContent;
    let title = rawTitle;

    if (uploadedFile) {
      content = await extractTextFromUploadedFile(uploadedFile);
      if (!title) {
        title = inferPaperTitle(uploadedFile.originalname, content);
      }
    }

    if (!title || !content) {
      return errorResponse(res, 'Title and content required', 400);
    }

    const wordCount = countWords(content);
    const characterCount = content.length;

    if (wordCount > PAPER_LIMITS.maxWords) {
      return errorResponse(
        res,
        `Paper is too long. Maximum is ${PAPER_LIMITS.maxWords} words (${characterCount} characters received).`,
        413,
      );
    }

    if (characterCount > PAPER_LIMITS.maxCharacters) {
      return errorResponse(
        res,
        `Paper is too long. Maximum is ${PAPER_LIMITS.maxCharacters} characters (${characterCount} characters received).`,
        413,
      );
    }

    await client.query('BEGIN');

    const paperId = uuidv4();
    const now = new Date();

    // Create paper
    const paperResult = await client.query(
      `INSERT INTO papers (id, user_id, title, original_content, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [paperId, req.userId, title, content, 'draft', now, now],
    );

    if (paperResult.rows.length === 0) {
      throw new Error('Failed to create paper');
    }

    // Parse content into paragraphs
    const normalizedContent = String(content);
    const paragraphs = normalizedContent
      .split(/\n\n+/)
      .map((paragraphText: string) => paragraphText.trim())
      .filter((paragraphText: string) => paragraphText.length > 0);

    // Create version
    const versionId = uuidv4();
    const versionResult = await client.query(
      `INSERT INTO paper_versions (id, paper_id, version_number, content, overall_score, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [versionId, paperId, 1, content, 0, now],
    );

    if (versionResult.rows.length === 0) {
      throw new Error('Failed to create paper version');
    }

    // Create paragraph records
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraphId = uuidv4();
      await client.query(
        `INSERT INTO paragraphs (id, version_id, paragraph_order, original_text, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [paragraphId, versionId, i + 1, paragraphs[i], 'pending', now],
      );
    }

    // Update paper with current version
    const updateResult = await client.query(
      `UPDATE papers SET current_version_id = $1 WHERE id = $2 RETURNING id`,
      [versionId, paperId],
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Failed to update paper');
    }

    await client.query('COMMIT');

    successResponse(
      res,
      {
        id: paperId,
        title,
        versionId,
        paragraphCount: paragraphs.length,
        source: uploadedFile ? 'file' : 'text',
        wordCount,
        characterCount,
        limits: PAPER_LIMITS,
      },
      'Paper uploaded successfully',
      201,
    );
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Upload error:', error);
    errorResponse(res, 'Failed to upload paper: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    client.release();
  }
});

// Get papers
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const result = await pool.query(
      `SELECT id, title, status, created_at, updated_at FROM papers WHERE user_id = $1 ORDER BY updated_at DESC`,
      [req.userId],
    );

    successResponse(res, result.rows);
  } catch (error) {
    console.error('Fetch papers error:', error);
    errorResponse(res, 'Failed to fetch papers');
  }
});

// Get paper details
router.get('/:paperId', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const { paperId } = req.params;

    const result = await pool.query(
      `SELECT id, title, original_content, current_version_id, status,
              analysis_progress AS "analysisProgress",
              analysis_message AS "analysisMessage",
              analysis_total_paragraphs AS "analysisTotalParagraphs",
              analysis_processed_paragraphs AS "analysisProcessedParagraphs",
              analysis_started_at AS "analysisStartedAt",
              analysis_completed_at AS "analysisCompletedAt",
              created_at AS "createdAt",
              updated_at AS "updatedAt"
       FROM papers WHERE id = $1 AND user_id = $2`,
      [paperId, req.userId],
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Paper not found', 404);
    }

    successResponse(res, result.rows[0]);
  } catch (error) {
    console.error('Fetch paper error:', error);
    errorResponse(res, 'Failed to fetch paper');
  }
});

// Analyze paper
router.post('/:paperId/analyze', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const { paperId } = req.params;
    const staleAnalysisThresholdMs = 5 * 60 * 1000;

    // Get paper state first so we can resume or restart safely.
    const paperResult = await pool.query(
      `SELECT id, title, current_version_id, status, updated_at, analysis_started_at AS "analysisStartedAt"
       FROM papers WHERE id = $1 AND user_id = $2`,
      [paperId, req.userId],
    );

    if (paperResult.rows.length === 0) {
      return errorResponse(res, 'Paper not found', 404);
    }

    const paper = paperResult.rows[0];

    if (paper.status === 'analyzing') {
      const updatedAtMs = paper.updated_at ? new Date(paper.updated_at).getTime() : 0;
      const isStale = updatedAtMs > 0 && Date.now() - updatedAtMs > staleAnalysisThresholdMs;

      if (!isStale) {
        const progressResult = await pool.query(
          `SELECT status,
                  analysis_progress AS "analysisProgress",
                  analysis_message AS "analysisMessage",
                  analysis_total_paragraphs AS "analysisTotalParagraphs",
                  analysis_processed_paragraphs AS "analysisProcessedParagraphs",
                  analysis_started_at AS "analysisStartedAt",
                  analysis_completed_at AS "analysisCompletedAt"
           FROM papers WHERE id = $1`,
          [paperId],
        );

        return successResponse(res, progressResult.rows[0], 'Analysis already running', 202);
      }

      await pool.query(
        `UPDATE papers
         SET status = 'draft',
             analysis_progress = 0,
             analysis_message = 'Previous analysis was interrupted. Ready to rerun.',
             analysis_total_paragraphs = 0,
             analysis_processed_paragraphs = 0,
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2`,
        [paperId, req.userId],
      );
    }

    // Start a fresh run from the beginning.
    void runPaperAnalysis(paperId, req.userId).catch((error) => {
      console.error('Failed to queue paper analysis:', error);
    });

    successResponse(
      res,
      {
        paperId,
        status: 'analyzing',
        analysisProgress: 0,
        analysisMessage: 'Analysis started',
        maxParagraphs: ANALYSIS_LIMITS.maxParagraphs,
        maxParagraphCharacters: ANALYSIS_LIMITS.maxParagraphCharacters,
      },
      'Analysis started',
      202,
    );
  } catch (error) {
    console.error('Analysis error:', error);
    errorResponse(res, 'Failed to analyze paper');
  }
});

router.get('/:paperId/progress', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const { paperId } = req.params;

    const result = await pool.query(
      `SELECT id, status,
              analysis_progress AS "analysisProgress",
              analysis_message AS "analysisMessage",
              analysis_total_paragraphs AS "analysisTotalParagraphs",
              analysis_processed_paragraphs AS "analysisProcessedParagraphs",
              analysis_started_at AS "analysisStartedAt",
              analysis_completed_at AS "analysisCompletedAt",
              updated_at AS "updatedAt"
       FROM papers WHERE id = $1 AND user_id = $2`,
      [paperId, req.userId],
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Paper not found', 404);
    }

    successResponse(res, result.rows[0]);
  } catch (error) {
    console.error('Fetch analysis progress error:', error);
    errorResponse(res, 'Failed to fetch analysis progress');
  }
});

// Get paragraphs
router.get('/:paperId/paragraphs', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const { paperId } = req.params;

    // Verify ownership
    const paperResult = await pool.query(
      `SELECT current_version_id FROM papers WHERE id = $1 AND user_id = $2`,
      [paperId, req.userId],
    );

    if (paperResult.rows.length === 0) {
      return errorResponse(res, 'Paper not found', 404);
    }

    const versionId = paperResult.rows[0].current_version_id;

    const result = await pool.query(
      `SELECT id, version_id, paragraph_order, original_text, revised_text, citation_score, coherence_score, alignment_score, research_gap_score, status, created_at 
       FROM paragraphs WHERE version_id = $1 ORDER BY paragraph_order ASC`,
      [versionId],
    );

    successResponse(res, result.rows);
  } catch (error) {
    console.error('Fetch paragraphs error:', error);
    errorResponse(res, 'Failed to fetch paragraphs');
  }
});

// Get analysis results
router.get('/:paperId/analysis', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const { paperId } = req.params;

    // Verify ownership and get paragraphs
    const paperResult = await pool.query(
      `SELECT current_version_id FROM papers WHERE id = $1 AND user_id = $2`,
      [paperId, req.userId],
    );

    if (paperResult.rows.length === 0) {
      return errorResponse(res, 'Paper not found', 404);
    }

    const versionId = paperResult.rows[0].current_version_id;

    // Get all analysis results for this version
    const result = await pool.query(
      `SELECT ar.* FROM analysis_results ar
       JOIN paragraphs p ON ar.paragraph_id = p.id
       WHERE p.version_id = $1
       ORDER BY ar.created_at DESC`,
      [versionId],
    );

    successResponse(res, result.rows);
  } catch (error) {
    console.error('Fetch analysis error:', error);
    errorResponse(res, 'Failed to fetch analysis results');
  }
});

export default router;
