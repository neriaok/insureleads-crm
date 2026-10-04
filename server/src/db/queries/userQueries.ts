import type { User, UserRole, UserWithPasswordHash } from '../../types/models.js';
import { pool } from '../pool.js';

const USER_COLUMNS = `id, name, email, role, created_at AS "createdAt"`;

export async function findUserByEmail(email: string): Promise<UserWithPasswordHash | null> {
  const result = await pool.query<UserWithPasswordHash>(
    `SELECT ${USER_COLUMNS}, password_hash AS "passwordHash" FROM users WHERE email = $1`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: number): Promise<User | null> {
  const result = await pool.query<User>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function listUsers(): Promise<User[]> {
  const result = await pool.query<User>(`SELECT ${USER_COLUMNS} FROM users ORDER BY name`);
  return result.rows;
}

export async function insertUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}): Promise<User> {
  const result = await pool.query<User>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${USER_COLUMNS}`,
    [input.name, input.email, input.passwordHash, input.role],
  );
  const user = result.rows[0];
  if (!user) {
    throw new Error('INSERT INTO users returned no row');
  }
  return user;
}
