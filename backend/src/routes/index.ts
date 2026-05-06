import express, { Request, Response } from 'express';
import { successResponse } from '../utils/response';
import authRoutes from './auth';
import paperRoutes from './papers';
import paragraphRoutes from './paragraphs';
import referenceRoutes from './references';
import suggestionRoutes from './suggestions';

const router = express.Router();

// API version
router.get('/version', (req: Request, res: Response) => {
  successResponse(res, { version: '0.1.0', status: 'development' });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/papers', paperRoutes);
router.use('/paragraphs', paragraphRoutes);
router.use('/references', referenceRoutes);
router.use('/suggestions', suggestionRoutes);

export default router;
