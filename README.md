# MoneRakhbe AI — Production-Ready AI Personal Memory & Reminder SaaS

**MoneRakhbe AI** (মনে রাখবে এআই) is a full-featured, production-ready AI Personal Memory & Reminder SaaS web application with direct **Telegram Bot** integration and Google Gemini NLU engine.

Users can talk naturally in **Bangla (বাংলা), Banglish, and English** to set one-time & recurring reminders, store personal memories (e.g. birthdays, passport dates, addresses), manage tasks, and receive punctual Telegram notifications with rich inline keyboards (`[Done]`, `[Snooze 1h/3h/Tomorrow]`, `[Delete]`) and non-intrusive smart follow-ups.

---

## 🌟 Key Highlights & Core Capabilities

1. **Natural Language Understanding (Gemini + Local Guardrails)**:
   - Understands colloquial Bangla (*"কাল বিকেল ৫টায় রাকিবকে ফোন দেওয়ার কথা মনে করিয়ে দিও"*), Banglish (*"kal 5tay client call"*), and English.
   - **Zero Recurrence Assumption Rule**: Never creates recurring rules unless explicitly specified (*"আগামী মাসের ২০ তারিখ"* creates a ONE-TIME reminder, whereas *"প্রতি মাসের ২০ তারিখ"* creates a MONTHLY recurring reminder).
   - **Memory vs. Reminder Isolation**: *"আমার ভাইয়ের জন্মদিন ১২ ডিসেম্বর"* stores a personal memory under Family category; *"১২ ডিসেম্বর ভাইয়ের জন্মদিন, প্রতি বছর মনে করিয়ে দিও"* creates both memory and a yearly recurring reminder.
   - **Offsets & Advance Alerts**: Supports *"৩ দিন আগে মনে করিয়ে দিও"*, *"১ দিন আগে"*, *"১ ঘণ্টা আগে"*.
2. **Official Telegram Bot Integration**:
   - Deep-linking account connection (`/start connect_TOKEN`).
   - Webhook processor (`/api/telegram/webhook`) handling commands, natural conversations, and callback query buttons.
3. **Idempotent Background Scheduler Worker**:
   - Dispatches scheduled notifications at exact times.
   - Idempotent deduplication keys prevent duplicate messages even under concurrent execution.
   - Smart Overdue Follow-ups without annoying spam.
4. **Modern UI & Feature Suite**:
   - **Landing Page** with live interactive demo simulator.
   - **Dashboard** with Today's schedule, Upcoming list, Tasks Kanban, Categorized Memory Vault, and Month/Week/Day Calendar.
   - **AI Web Chat Widget** sharing the exact same NLU backend as Telegram.
   - **Admin Control Panel** (`/admin`) with real-time stats, user management, audit stream, and failed notification retry.
   - **Data Export** (JSON & CSV) and permanent account deletion.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS + Custom Design System
- **Database & ORM**: PostgreSQL / SQLite with Prisma ORM
- **AI Engine**: Google Gemini API (`@google/generative-ai`) with deterministic fallback parser
- **Telegram Bot**: Telegram Bot API (Webhooks & Inline Keyboards)
- **Authentication**: Multi-tenant JWT & bcryptjs password hashing
- **Testing**: Vitest automated test suite

---

## 🚀 Getting Started

### 1. Environment Variables Configuration

Copy `.env.example` to `.env` and fill in your keys:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="MoneRakhbe AI"

# Database Configuration (SQLite default for local, Supabase/PostgreSQL for production)
DATABASE_URL="file:./dev.db"

# JWT Auth Secret
JWT_SECRET="monerakhbe-super-secure-production-jwt-secret-key-2026"

# Google Gemini API Key
GEMINI_API_KEY="your-gemini-api-key"

# Telegram Bot Integration
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_BOT_USERNAME="MoneRakhbeBot"
TELEGRAM_WEBHOOK_SECRET="monerakhbe_webhook_secret_key"

# Scheduler / Background Cron Secret
CRON_SECRET="monerakhbe_cron_secret_key"
```

### 2. Database Migration & Seeding

```bash
# Push schema to database
npm run db:push

# Generate Prisma Client
npm run db:generate

# Seed initial admin user & sample data
npm run db:seed
```

**Default Admin Credentials**:
- Email: `admin@monerakhbe.ai`
- Password: `Admin123456!`

### 3. Run Automated Tests

```bash
npm test
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 Telegram Webhook Setup for Production

To connect your Telegram bot webhook in production:

```bash
curl -F "url=https://your-domain.com/api/telegram/webhook" \
     -F "secret_token=your_telegram_webhook_secret" \
     https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
```

---

## ⏰ Cron Scheduler for Notifications

Trigger the notification worker via HTTP GET or POST on a recurring cron (e.g. every 1 minute):

```
GET https://your-domain.com/api/cron/reminder-worker
Headers:
  Authorization: Bearer <CRON_SECRET>
```

---

## 🧪 Verified Test Cases

The automated test suite (`npm test`) verifies:
- `"আগামী মাসের ২০ তারিখে বাড়ি যাব।"` ➡️ One-time reminder (`recurrence: null`, date: `2026-10-20`).
- `"প্রতি মাসের ২০ তারিখে বাড়ি যেতে হয়।"` ➡️ Monthly recurring reminder (`frequency: MONTHLY`, `dayOfMonth: 20`).
- `"প্রতি শুক্রবার বিকেল ৫টায় weekly meeting"` ➡️ Weekly recurring reminder (`frequency: WEEKLY`, time: `17:00`).
- `"২০ তারিখে বাড়ি যাব, ৩ দিন আগে মনে করিয়ে দিও।"` ➡️ One-time reminder with notification scheduled 3 days before.
- `"১২ ডিসেম্বর আমার ভাইয়ের জন্মদিন, মনে রেখো।"` ➡️ Memory only (`category: Family`, `key: Brother Birthday`).
- `"kal 5tay client ke call korte mone koriye dio"` ➡️ Banglish parsing with `17:00` time.
- Bengali numeral normalization (`০-৯` to `0-9`).
- Notification deduplication key idempotency.

---

## 📄 License

MIT License. Built for production excellence.
