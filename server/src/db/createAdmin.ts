// Creates the first admin user, since POST /api/users itself requires an admin.
// Usage: npm run create-admin -- --name "Dana Admin" --email dana@example.com --password secret123
import { parseArgs } from 'node:util';
import { createUserSchema } from '../schemas/userSchemas.js';
import { hashPassword } from '../utils/auth.js';
import { pool } from './pool.js';
import { findUserByEmail, insertUser } from './queries/userQueries.js';

const { values } = parseArgs({
  options: {
    name: { type: 'string' },
    email: { type: 'string' },
    password: { type: 'string' },
  },
});

const parsed = createUserSchema.safeParse({ ...values, role: 'admin' });
if (!parsed.success) {
  console.error('Invalid input:', parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', '));
  console.error('Usage: npm run create-admin -- --name "Dana Admin" --email dana@example.com --password secret123');
  process.exit(1);
}

try {
  const input = parsed.data;
  if (await findUserByEmail(input.email)) {
    console.error(`A user with email ${input.email} already exists`);
    process.exitCode = 1;
  } else {
    const user = await insertUser({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: 'admin',
    });
    console.log(`Created admin #${user.id}: ${user.email}`);
  }
} finally {
  await pool.end();
}
