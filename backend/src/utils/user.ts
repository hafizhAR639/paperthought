import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { hashPassword, comparePasswords } from './password';
import { User } from '../types/index';

export async function createUser(
  email: string,
  password: string,
  fullName: string,
  institution?: string,
): Promise<User> {
  const hashedPassword = await hashPassword(password);
  const id = uuidv4();
  const now = new Date();

  const result = await pool.query(
    `INSERT INTO users (id, email, password_hash, full_name, institution, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, full_name AS "fullName", institution, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [id, email, hashedPassword, fullName, institution || null, now, now],
  );

  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT id, email, full_name AS "fullName", institution, created_at AS "createdAt", updated_at AS "updatedAt" FROM users WHERE email = $1',
    [email],
  );
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT id, email, full_name AS "fullName", institution, created_at AS "createdAt", updated_at AS "updatedAt" FROM users WHERE id = $1',
    [id],
  );
  return result.rows[0] || null;
}

export async function verifyUserPassword(
  email: string,
  password: string,
): Promise<{ user: User; valid: boolean }> {
  const user = await getUserByEmail(email);
  if (!user) {
    return { user: null as any, valid: false };
  }

  const userWithPassword = await pool.query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
  const valid = await comparePasswords(password, userWithPassword.rows[0].password_hash);

  return { user, valid };
}
