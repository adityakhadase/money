# MoneyTrack — Modern Ledger & EMI Tracker

A full-stack personal finance web application built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL**.

---

## Features

- **Peer-to-Peer Ledger**: Track money lent to (`LENT`) and borrowed from (`BORROWED`) friends.
- **Unified Balance Engine**: Automatically reconciles who owes you vs. who you owe with mathematical consistency.
- **Smart Reminders**: Send friendly payment reminder notifications via **Resend (Email)** and **Twilio (WhatsApp)**, or use direct WhatsApp click-to-chat links.
- **Settle Up Flow**: One-click debt settlements with celebratory Canvas Confetti.
- **Loan & EMI Tracker**: Auto-calculates monthly EMI installments using the standard amortization formula, complete with principal vs. interest breakdown and auto-debit dates.
- **Weekly Digests**: Automated weekly financial summary emails scheduled via **Vercel Cron**.
- **Dynamic Letter Avatars**: Beautiful initials-based profile avatars with automatic color hashing.

---

## Tech Stack

- **Framework**: Next.js 14.2.15 (App Router, Server & Client Components)
- **Frontend**: React 18, Tailwind CSS, Lucide React, Canvas Confetti
- **Database & ORM**: PostgreSQL via Prisma ORM 5.22.0
- **Email Delivery**: Resend SDK (Graceful mock fallback if unconfigured)
- **Messaging**: Twilio SDK (Graceful mock fallback if unconfigured)
- **Deployment**: Vercel (Serverless Functions & Vercel Cron)

---

## Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **PostgreSQL**: A local PostgreSQL instance OR a free cloud PostgreSQL database (e.g., [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)).

### 2. Clone and Install Dependencies
```bash
git clone <your-repository-url>
cd stitch_moneytrack_finance_app
npm install
```

### 3. Environment Variables
Copy the template file to create your `.env`:
```bash
cp .env.example .env
```
Fill in your database URL and optional notification credentials in `.env`:
```env
# Required: PostgreSQL Connection URL
DATABASE_URL="postgresql://username:password@hostname:5432/database_name?sslmode=require"

# Optional: Resend API Key for emails
RESEND_API_KEY=""

# Optional: Twilio credentials for WhatsApp
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Optional: Personal Host Info
MY_NAME="Aditya"
MY_EMAIL="user@example.com"
MY_WHATSAPP_NUMBER="whatsapp:+919876543210"

# Optional: Secret for Vercel Cron
CRON_SECRET=""
```

### 4. Database Setup & Migrations
Generate Prisma Client and apply the PostgreSQL migration:
```bash
# Generate the Prisma Client
npx prisma generate

# Apply migrations to your PostgreSQL database
npx prisma migrate deploy
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Deployment Guide (GitHub → Vercel → PostgreSQL)

### Step 1: Push to GitHub
1. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "feat: prepare MoneyTrack for Vercel and PostgreSQL deployment"
   ```
2. Create a new repository on GitHub and push:
   ```bash
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```
*(The included `.gitignore` ensures your `.env` file, local databases, and build artifacts are NEVER committed).*

---

### Step 2: Create a Hosted PostgreSQL Database
Choose any hosted PostgreSQL provider:
- **[Neon](https://neon.tech)** (Recommended, 1-click free serverless Postgres)
- **[Supabase](https://supabase.com)** (Free tier includes PostgreSQL)
- **[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)** (Native integration)

Copy the connection string (it will look like `postgresql://user:pass@ep-xyz.region.neon.tech/neondb?sslmode=require`).

---

### Step 3: Run Database Migrations
Before deploying to Vercel, run the migration against your hosted database from your local machine:
```bash
# Temporarily set your DATABASE_URL in .env or pass it directly:
npx prisma migrate deploy
```
This creates the tables (`UserProfile`, `Person`, `Transaction`, `Repayment`, `EMI`, `EMI_Payment`) in your production PostgreSQL database.

---

### Step 4: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Import your GitHub repository.
3. In **Build and Output Settings**, verify:
   - **Framework Preset**: Next.js
   - **Build Command**: `prisma generate && next build` (defined in `package.json`)
4. In **Environment Variables**, add the following:

| Variable | Required | Value / Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | **YES** | Your PostgreSQL connection string from Neon / Supabase |
| `RESEND_API_KEY` | Optional | Your API key from Resend (`re_...`) |
| `TWILIO_ACCOUNT_SID` | Optional | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Optional | Your Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | Optional | Twilio WhatsApp number (e.g. `whatsapp:+14155238886`) |
| `MY_NAME` | Optional | Your name displayed in reminder emails (e.g. `Aditya`) |
| `MY_EMAIL` | Optional | Your email to receive settlement receipts and weekly reports |
| `MY_WHATSAPP_NUMBER` | Optional | Your WhatsApp number for notifications |
| `CRON_SECRET` | Optional | Secure random string matching Vercel Cron authentication |

5. Click **Deploy**.
6. Once deployed, open the assigned public URL (e.g. `https://your-project.vercel.app`) on your computer or mobile phone!

---

## Vercel Cron Configuration

MoneyTrack includes a preconfigured cron job in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/reports/weekly",
      "schedule": "0 9 * * 0"
    }
  ]
}
```
- Runs every **Sunday at 09:00 UTC**.
- Generates a financial summary of receivables, payables, upcoming EMIs, and settlements.
- Sends an email digest via Resend to `MY_EMAIL`.

---

## Useful Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start local development server |
| `npm run build` | Generate Prisma client and create production build |
| `npx prisma studio` | Open visual database GUI in browser |
| `npx prisma validate` | Validate schema syntax and relations |
| `npx prisma migrate deploy` | Apply pending migrations to database |
| `npx prisma generate` | Regenerate Prisma Client types |
