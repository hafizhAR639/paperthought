import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Upload reference paper
router.post('/upload', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const { title, authors, year, content } = req.body;

    if (!title || !content) {
      return errorResponse(res, 'Title and content required', 400);
    }

    const id = uuidv4();
    const now = new Date();

    await pool.query(
      `INSERT INTO reference_papers (id, user_id, title, authors, year, extracted_content, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, req.userId, title, authors || [], year || null, content, now],
    );

    // TODO: Extract findings and generate embeddings

    successResponse(res, { id, title }, 'Reference uploaded successfully', 201);
  } catch (error) {
    console.error('Upload reference error:', error);
    errorResponse(res, 'Failed to upload reference');
  }
});

// Get references
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const result = await pool.query(
      `SELECT id, title, authors, year FROM reference_papers WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId],
    );

    successResponse(res, result.rows);
  } catch (error) {
    console.error('Fetch references error:', error);
    errorResponse(res, 'Failed to fetch references');
  }
});

// Get reference findings
router.get('/:referenceId/findings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { referenceId } = req.params;

    const result = await pool.query(
      `SELECT id, finding_type, content, page_number FROM reference_findings WHERE reference_id = $1`,
      [referenceId],
    );

    successResponse(res, result.rows);
  } catch (error) {
    console.error('Fetch findings error:', error);
    errorResponse(res, 'Failed to fetch findings');
  }
});

// Delete reference
router.delete('/:referenceId', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const { referenceId } = req.params;

    // Verify ownership
    const result = await pool.query(
      `SELECT user_id FROM reference_papers WHERE id = $1`,
      [referenceId],
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 'Reference not found', 404);
    }

    if (result.rows[0].user_id !== req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    await pool.query(`DELETE FROM reference_papers WHERE id = $1`, [referenceId]);

    successResponse(res, { id: referenceId }, 'Reference deleted');
  } catch (error) {
    console.error('Delete reference error:', error);
    errorResponse(res, 'Failed to delete reference');
  }
});

export default router;
