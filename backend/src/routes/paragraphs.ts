import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Revise paragraph
router.post('/:paragraphId/revise', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const { paragraphId } = req.params;
    const { revised_text } = req.body;

    if (!revised_text) {
      return errorResponse(res, 'Revised text required', 400);
    }

    // Verify ownership (check if user owns the paper)
    const result = await pool.query(
      `SELECT p.id FROM paragraphs p
       JOIN paper_versions pv ON p.version_id = pv.id
       JOIN papers pp ON pv.paper_id = pp.id
       WHERE p.id = $1 AND pp.user_id = $2`,
      [paragraphId, req.userId],
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Paragraph not found', 404);
    }

    // Update paragraph
    const now = new Date();
    await pool.query(
      `UPDATE paragraphs SET revised_text = $1 WHERE id = $2`,
      [revised_text, paragraphId],
    );

    successResponse(res, { id: paragraphId, revised_text }, 'Revision saved');
  } catch (error) {
    console.error('Revise paragraph error:', error);
    errorResponse(res, 'Failed to save revision');
  }
});

// Re-analyze paragraph
router.post('/:paragraphId/reanalyze', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const { paragraphId } = req.params;

    // TODO: Implement re-analysis logic with current paragraph text

    successResponse(res, { status: 'analyzing' });
  } catch (error) {
    console.error('Re-analyze error:', error);
    errorResponse(res, 'Failed to re-analyze');
  }
});

// Approve paragraph
router.post('/:paragraphId/approve', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const { paragraphId } = req.params;

    await pool.query(
      `UPDATE paragraphs SET status = $1 WHERE id = $2`,
      ['approved', paragraphId],
    );

    successResponse(res, { id: paragraphId, status: 'approved' });
  } catch (error) {
    console.error('Approve error:', error);
    errorResponse(res, 'Failed to approve paragraph');
  }
});

// Get analysis for paragraph
router.get('/:paragraphId/analysis', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { paragraphId } = req.params;

    const result = await pool.query(
      `SELECT * FROM analysis_results WHERE paragraph_id = $1 ORDER BY created_at DESC`,
      [paragraphId],
    );

    successResponse(res, result.rows);
  } catch (error) {
    console.error('Fetch paragraph analysis error:', error);
    errorResponse(res, 'Failed to fetch analysis');
  }
});

export default router;
