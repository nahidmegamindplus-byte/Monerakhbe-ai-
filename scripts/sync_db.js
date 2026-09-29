const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Pushing Prisma schema...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
  console.log('Database synced and Prisma client generated successfully.');
} catch (error) {
  console.error('Error syncing db:', error.message);
  process.exit(1);
}
