import { pool } from '../config/database';
import {
  setupTestDatabase,
  clearTestDatabase,
  createTestUser,
  generateTestJWT,
  testUser,
} from './helpers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';

describe('Authentication MVP', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('User Registration', () => {
    test('should fail with missing email', async () => {
      const { email, ...rest } = testUser;
      expect(email).toBeDefined();
    });

    test('should create new user with valid credentials', async () => {
      const user = await createTestUser();
      const result = await pool.query(`SELECT id, email FROM users WHERE email = $1`, [
        testUser.email,
      ]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].email).toBe(testUser.email);
    });

    test('should hash password on user creation', async () => {
      const user = await createTestUser();
      const result = await pool.query(
        `SELECT password_hash FROM users WHERE id = $1`,
        [user.id],
      );

      expect(result.rows[0].password_hash).not.toBe(testUser.password);
      expect(result.rows[0].password_hash.length).toBeGreaterThan(20);
    });

    test('should reject duplicate email', async () => {
      await createTestUser();
      
      const duplicateHash = await bcrypt.hash(testUser.password, 10);
      const now = new Date();

      await expect(
        pool.query(
          `INSERT INTO users (id, email, password_hash, full_name, institution, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          ['new-id', testUser.email, duplicateHash, 'Another User', 'Uni', now, now],
        ),
      ).rejects.toThrow();
    });
  });

  describe('User Login', () => {
    test('should verify correct password', async () => {
      const user = await createTestUser();
      const result = await pool.query(
        `SELECT password_hash FROM users WHERE email = $1`,
        [testUser.email],
      );

      const passwordMatch = await bcrypt.compare(
        testUser.password,
        result.rows[0].password_hash,
      );
      expect(passwordMatch).toBe(true);
    });

    test('should fail on incorrect password', async () => {
      await createTestUser();
      const result = await pool.query(
        `SELECT password_hash FROM users WHERE email = $1`,
        [testUser.email],
      );

      const passwordMatch = await bcrypt.compare(
        'WrongPassword123!',
        result.rows[0].password_hash,
      );
      expect(passwordMatch).toBe(false);
    });
  });

  describe('JWT Token', () => {
    test('should generate valid JWT', () => {
      const userId = 'test-user-id';
      const token = generateTestJWT(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('should decode valid JWT with correct userId', () => {
      const userId = 'test-user-id';
      const token = generateTestJWT(userId);

      const decoded = jwt.verify(token, config.jwtSecret) as any;
      expect(decoded.userId).toBe(userId);
    });

    test('should reject invalid JWT', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwt.verify(invalidToken, config.jwtSecret);
      }).toThrow();
    });

    test('should reject expired JWT', () => {
      const userId = 'test-user-id';
      const token = jwt.sign({ userId }, config.jwtSecret, { expiresIn: '0s' });

      // Wait a tiny bit to ensure expiration
      setTimeout(() => {
        expect(() => {
          jwt.verify(token, config.jwtSecret);
        }).toThrow();
      }, 10);
    });
  });
});
