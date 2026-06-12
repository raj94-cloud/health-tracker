# 🥗 Nourish — Complete Setup & Deployment Guide

## Overview
A daily meal tracker where you upload food photos and AI automatically identifies items in Kannada.
- **Frontend + API**: Next.js (hosted on Vercel)
- **Database + Storage + Auth**: Supabase
- **AI Analysis**: Google Gemini
- **Cost**: 100% Free

---

## STEP 1 — Supabase Setup (Database + Storage + Auth)

### What is Supabase?
Supabase is a free backend service. We use it for:
- **Database** → stores meal records (image URL, food items, date)
- **Storage** → stores the actual image files
- **Auth** → manages user login/signup

### 1.1 Create Project
1. Go to https://supabase.com
2. Click **Start your project** → Sign up free
3. Click **New project**
4. Fill in: Project name = `nourish`, set a database password, choose a region
5. Click **Create new project** → wait ~2 minutes

### 1.2 Create Database Table
1. In left sidebar → click **SQL Editor**
2. Click **New query**
3. Paste this SQL and click **Run**:

```sql
create table meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  image_url text not null,
  detected_items text[] default '{}',
  analysis_text text,
  logged_at timestamptz default now(),
  meal_date date default current_date
);

alter table meals enable row level security;

create policy "Users see own meals" on meals
  for all using (true) with check (true);

grant all on public.meals to anon, authenticated;
```

### 1.3 Create Storage Bucket
1. Left sidebar → **Storage**
2. Click **New bucket**
3. Name: `meals` (exactly, lowercase)
4. Toggle **Public bucket** ON
5. Click **Save**
6. Click the `meals` bucket → **Policies** tab → **New policy**
7. Select all operations (SELECT, INSERT, UPDATE, DELETE) for **authenticated** users → Save

Also run this in SQL Editor:
```sql
create policy "Auth users can upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'meals');

create policy "Auth users can read" on storage.objects
  for select to authenticated using (bucket_id = 'meals');
```

### 1.4 Configure Auth
1. Left sidebar → **Authentication** → **URL Configuration**
2. **Site URL** → set to your Vercel URL (e.g. `https://health-tracker-sooty-phi.vercel.app`)
3. **Redirect URLs** → add `https://health-tracker-sooty-phi.vercel.app/**`
4. Also add `http://localhost:3000/**` for local development
5. Click **Save**
6. Go to **Sign In / Providers** → make sure **Email** is enabled

### 1.5 Get Your Keys
1. Left sidebar → **Project Settings** (gear icon ⚙️) → **API**
2. Copy these two values:
   - **Project URL** → looks like `https://xxxxxxxxxxxxxx.supabase.co`
   - **anon public** key → long string starting with `eyJhbGci...`

---

## STEP 2 — Google Gemini API Setup (AI Analysis)

### What is Gemini?
Google's AI model that analyses images and identifies food items. Free tier = 1500 requests/day (we only need 3/day).

### 2.1 Create API Key
1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **Create API key**
4. Select **"Default Gemini Project"** from dropdown
5. Copy the API key

### 2.2 Enable the API
1. Go to https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. Make sure your Gemini project is selected at the top
3. Click **Enable** if not already enabled

---

## STEP 3 — Local Development Setup

### 3.1 Prerequisites
- Node.js installed (v18 or higher)
- Git installed

### 3.2 Clone & Install
```bash
cd /home/ubuntu/health-tracker
npm install
```

### 3.3 Configure Environment Variables
Edit `.env.local` with your real keys:
```bash
nano .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
GEMINI_API_KEY=your-gemini-api-key
```

### 3.4 Run Locally
```bash
npm run dev
```
Open http://localhost:3000

---

## STEP 4 — Vercel Deployment (Hosting)

### What is Vercel?
Free hosting platform built for Next.js. Gives you a public URL your girlfriend can access from anywhere.

### 4.1 Install & Login
```bash
npx vercel
```
- Visit the URL shown to login with your browser
- Authorize Vercel CLI

### 4.2 Add Environment Variables
```bash
# Add Supabase URL (not sensitive)
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
# → Is sensitive? N
# → Value: https://xxxxxxxxxxxxxx.supabase.co
# → Environments: press 'a' to select all → Enter

# Add Supabase Anon Key (not sensitive — it's public)
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# → Is sensitive? N
# → Value: eyJhbGci...
# → Environments: press 'a' to select all → Enter

# Add Gemini Key (sensitive)
npx vercel env add GEMINI_API_KEY
# → Is sensitive? Y
# → Value: your-gemini-key
# → Environments: press 'a' to select all → Enter
```

### 4.3 Deploy to Production
```bash
npx vercel --prod
```
Your app is live at the URL shown! 🎉

---

## STEP 5 — Future Updates

Whenever you change any code:
```bash
cd /home/ubuntu/health-tracker
# make your code changes
npx vercel --prod
```
That's it — live in ~30 seconds.

To update an environment variable:
```bash
npx vercel env rm VARIABLE_NAME
npx vercel env add VARIABLE_NAME
npx vercel --prod
```

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Invalid API key` | Wrong Supabase anon key | Re-add `NEXT_PUBLIC_SUPABASE_ANON_KEY` on Vercel |
| `Bucket not found` | Storage bucket missing | Create `meals` bucket in Supabase Storage |
| `permission denied for table meals` | Missing DB grant | Run `grant all on public.meals to anon, authenticated;` in SQL Editor |
| `row-level security policy` | Missing storage policy | Add INSERT + SELECT policies on `meals` bucket |
| `quota exceeded` | Gemini daily limit hit | Wait until midnight — resets daily. Normal use (3 imgs/day) never hits limit |
| `models/gemini not found` | Wrong model name | Use `gemini-2.0-flash` in the API route |
| `Failed to fetch` on login | Wrong Supabase URL | Fix `NEXT_PUBLIC_SUPABASE_URL` — must be `https://xxxxx.supabase.co` not the dashboard URL |

---

## Project File Structure

```
health-tracker/
├── app/
│   ├── page.tsx                  ← Today's tracker (upload 3 meals)
│   ├── history/page.tsx          ← Calendar history view
│   ├── login/page.tsx            ← Email + password login
│   ├── auth/callback/route.ts    ← Auth redirect handler
│   └── api/
│       ├── analyse/route.ts      ← Calls Gemini AI to analyse image
│       └── upload/route.ts       ← (unused — upload now done client-side)
├── lib/
│   └── supabase.ts               ← Supabase client
├── .env.local                    ← Your secret keys (never commit this)
├── supabase-schema.sql           ← Database setup SQL
└── README.md                     ← This file
```

---

## Key URLs

| Service | URL |
|---|---|
| Live App | https://health-tracker-sooty-phi.vercel.app |
| Supabase Dashboard | https://supabase.com/dashboard/project/rftlamzrwbkncnlvfsqf |
| Vercel Dashboard | https://vercel.com/reddyrajkumar2025-8686s-projects/health-tracker |
| Gemini API Keys | https://aistudio.google.com/apikey |
| Google Cloud Console | https://console.cloud.google.com |
