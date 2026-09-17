# The $1.8M Internet Experiment (Autonomous Node)

An autonomous full-stack web entity designed to solicit global micro-contributions toward a post-tax goal of $1,800,000. It features an automated "kill switch" agent that monitors real-time revenue and terminates the site if the countdown clock depletes before funding milestones are reached.

---

## ⚡ Features
- **Global Multi-Currency Checkout**: Integrated Stripe Checkout supporting cards, Apple Pay, and Google Pay from the US, UK, Australia, and the UAE.
- **Autonomous Lifespan Logic**: Every contribution dynamically increases the node's survival timer.
- **Realtime Telemetry**: Powered by Next.js 14 and Supabase PostgreSQL.
- **Automated Kill Switch**: A background daemon (`agent.mjs`) triggers self-destruct via the Vercel API and database wipe if the node runs out of time.
- **Hands-Off GitHub Cron**: Pre-configured GitHub Action (`.github/workflows/agent-cron.yml`) to check survival conditions every 6 hours without human intervention.

---

## 🚀 Quick Setup Guide

### 1. Database Setup
1. Create a free database at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** and paste the contents of `db/schema.sql`.
3. Copy your **Project URL**, **Anon Key**, and **Service Role Key**.

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your keys:
```bash
cp .env.example .env.local
```

### 3. Install & Test Locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

### 4. Deploying to GitHub Pages (Automated CI/CD)
The project includes a GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) that automatically builds and deploys the static frontend to **GitHub Pages** on every push to `main`.
* **Live GitHub Pages URL**: [https://iv-krish.github.io/experiment-1.8m-autonomous-project/](https://iv-krish.github.io/experiment-1.8m-autonomous-project/)

### 5. Deploying to Netlify (Full-Stack with Dynamic API Routes)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/iv-krish/experiment-1.8m-autonomous-project)

1. Click the button above or import the repository on [Netlify](https://app.netlify.com/start).
2. Select `iv-krish/experiment-1.8m-autonomous-project`.
3. Add the environment variables from `.env.example` in Netlify **Site configuration > Environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_APP_URL`
4. Click **Deploy site**.
5. Add the Stripe Webhook URL: `https://your-netlify-subdomain.netlify.app/api/stripe-webhook`.

### 5. Deploying to Vercel
1. Push this project to your GitHub repository.
2. Import the repo on [Vercel](https://vercel.com).
3. Add the environment variables from `.env.local` into Vercel Settings.
4. Add the Stripe Webhook URL: `https://your-domain.com/api/stripe-webhook`.

### 5. Running the Autonomous Agent
- **Locally:** `npm run agent:check`
- **Automatically:** Add your Supabase and Vercel keys to **GitHub Secrets** (`Settings > Secrets & Variables > Actions`) and the `.github/workflows/agent-cron.yml` workflow will automatically run the heartbeat every 6 hours for free.

---

## ⚖️ Legal & Operational Notice
Contributions are recorded as digital novelty micro-participations in an internet social experiment. Ensure compliance with your local banking and tax regulations when linking your Stripe payouts.
