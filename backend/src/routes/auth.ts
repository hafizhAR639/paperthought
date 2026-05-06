import express, { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response.js';
import { createUser, verifyUserPassword } from '../utils/user.js';
import { generateToken } from '../utils/jwt.js';
import { authMiddleware } from '../middleware/auth.js';
import { getUserById } from '../utils/user.js';

const router = express.Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return errorResponse(res, 'Missing required fields', 400);
    }

    // TODO: Add email validation and uniqueness check
    const user = await createUser(email, password, fullName);
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    successResponse(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
        token,
      },
      'User registered successfully',
      201,
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === '23505') {
      return errorResponse(res, 'Email already exists', 400);
    }
    errorResponse(res, 'Registration failed');
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Missing email or password', 400);
    }

    const { user, valid } = await verifyUserPassword(email, password);

    if (!valid || !user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 'Login failed');
  }
});

// Get current user
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const user = await getUserById(req.userId);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      institution: user.institution,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    errorResponse(res, 'Failed to fetch profile');
  }
});

export default router;
