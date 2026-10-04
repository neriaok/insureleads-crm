// Copies the SQL migration files next to the compiled JavaScript, since tsc only emits .js.
// Usage: node scripts/copyMigrations.mjs <outDir>   (e.g. dist/db or build-test/src/db)
// Copies file by file: fs.cpSync on a directory fails on Windows paths with non-ASCII characters.
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2];
if (!outDir) {
  console.error('Usage: node scripts/copyMigrations.mjs <outDir>');
  process.exit(1);
}

const source = 'src/db/migrations';
const target = path.join(outDir, 'migrations');
mkdirSync(target, { recursive: true });
for (const file of readdirSync(source).filter((name) => name.endsWith('.sql'))) {
  copyFileSync(path.join(source, file), path.join(target, file));
}
