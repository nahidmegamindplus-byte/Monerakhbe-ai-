const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

try {
  console.log('[DB Sync] Checking database schema & migrations...');
  const dbUrl = process.env.DATABASE_URL || '';
  
  if (dbUrl && !dbUrl.includes('[YOUR-PASSWORD]')) {
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: rootDir });
      console.log('[DB Sync] Prisma schema pushed to database successfully.');
    } catch (pushErr) {
      console.warn('[DB Sync Notice] Could not push schema automatically. Prisma Client is ready.');
    }
  } else {
    console.log('[DB Sync Notice] DATABASE_URL has placeholder credentials. Skipping remote schema push.');
  }

  // Attempt default data seed if possible
  try {
    require('./seed.js');
  } catch (seedErr) {
    // optional seed
  }
} catch (error) {
  console.warn('[DB Sync Notice]', error.message);
}
