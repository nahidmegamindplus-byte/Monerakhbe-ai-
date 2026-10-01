/**
 * Zero-Config Environment & Deployment Guard
 * Ensures the project builds and runs smoothly on Vercel, Netlify, Render, Railway,
 * Docker, or any VPS WITHOUT requiring any external API keys or environment variables.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const prismaDir = path.join(rootDir, 'prisma');

// 1. Generate or verify fallback JWT secret
const defaultJwtSecret = 'monerakhbe-' + crypto.randomBytes(16).toString('hex');
const defaultCronSecret = 'cron-' + crypto.randomBytes(16).toString('hex');

const defaultEnvConfig = {
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_APP_NAME: 'MoneRakhbe AI',
  DATABASE_URL: 'file:./dev.db',
  JWT_SECRET: defaultJwtSecret,
  CRON_SECRET: defaultCronSecret,
  PAYMENT_MODE: 'test',
  ADMIN_EMAIL: 'admin@monerakhbe.ai',
  ADMIN_PASSWORD: 'Admin123456!',
  GEMINI_API_KEY: '',
  TELEGRAM_BOT_TOKEN: '',
  TELEGRAM_BOT_USERNAME: 'MoneRakhbeBot',
  TELEGRAM_WEBHOOK_SECRET: 'monerakhbe_webhook_secret',
};

try {
  let existingContent = '';
  if (fs.existsSync(envPath)) {
    existingContent = fs.readFileSync(envPath, 'utf8');
  }

  let updatedContent = existingContent;
  let hasModifications = false;

  for (const [key, defaultVal] of Object.entries(defaultEnvConfig)) {
    // Inject into process.env if missing
    if (!process.env[key]) {
      process.env[key] = defaultVal;
    }

    // If file exists but missing key, append it
    if (!existingContent.includes(`${key}=`)) {
      if (updatedContent && !updatedContent.endsWith('\n')) {
        updatedContent += '\n';
      }
      updatedContent += `${key}="${defaultVal}"\n`;
      hasModifications = true;
    }
  }

  if (!fs.existsSync(envPath) || hasModifications) {
    fs.writeFileSync(envPath, updatedContent.trim() + '\n', 'utf8');
    console.log('[Zero-Config Env] Auto-configured .env with zero-dependency deployment defaults.');
  } else {
    console.log('[Zero-Config Env] Existing .env validated successfully.');
  }

  // Ensure dev.db exists in root and prisma directory
  const rootDb = path.join(rootDir, 'dev.db');
  const prismaDb = path.join(prismaDir, 'dev.db');

  if (fs.existsSync(prismaDb) && !fs.existsSync(rootDb)) {
    try {
      fs.copyFileSync(prismaDb, rootDb);
    } catch (_) {}
  } else if (fs.existsSync(rootDb) && !fs.existsSync(prismaDb)) {
    try {
      fs.copyFileSync(rootDb, prismaDb);
    } catch (_) {}
  }
} catch (err) {
  console.warn('[Zero-Config Env Notice]', err.message);
}
