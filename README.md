# SweetsStats - Streaming Analytics Dashboard

A modern Next.js 14 analytics dashboard for Chaturbate models to track earnings, viewers, followers, and performance metrics.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Data Import**: PapaParse
- **Auth**: Cookie-based with middleware

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Update these values in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server operations)
- `DASHBOARD_PASSWORD` - Your dashboard login password

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to your Supabase project
2. In the SQL editor, run the contents of `schema.sql` to create tables
3. Optionally run `seed.sql` to populate with sample data

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will redirect you to the login page. Use the password you set in `DASHBOARD_PASSWORD`.

## Database Schema

### stream_sessions
Stores individual stream session data including viewers, rank, followers gained, and earnings.

### daily_earnings
Daily summary of earnings, tips, and top tipper information.

### tippers
Comprehensive tipper information including total spent, biggest tips, and activity dates.

### goals
Tracks goals (monthly revenue, follower targets, etc.) with current progress.

### settings
Key-value store for user preferences and configuration.

## Features

### Dashboard Pages

- **Overview** - Key metrics, earning trends, and viewer growth charts
- **Sessions** - Detailed stream session logs with filtering and notes
- **Earnings** - Daily earnings tracking with charts and top tipper highlights
- **Tippers** - Complete tipper database with search and sorting
- **Growth** - Long-term growth metrics for followers, viewers, and streaming hours
- **Import** - Manual entry forms, CSV upload, and Airtable sync (coming soon)
- **Intelligence** - AI-powered insights hub (coming soon)
- **Settings** - Password, earnings settings, day score weights, and integrations

### Key Features

- Password-protected dashboard with 30-day cookie auth
- Responsive design: bottom nav on mobile, sidebar on desktop
- Beautiful charts using Recharts
- CSV import support with column mapping
- Editable session notes
- Customizable day score weighting
- Real-time data from Supabase

## Styling

- **Accent Color**: Coral (#F97B6B)
- **Fonts**: DM Serif Display (headings), DM Sans (body)
- **Borders**: Light grey (#E5E7EB)
- **Clean, minimal SaaS design**

## Deployment

### Deploy to Vercel

```bash
npm run build
```

Push to GitHub and connect your repo to Vercel. Environment variables will be set in the Vercel dashboard.

### Environment Variables for Production

Set these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DASHBOARD_PASSWORD`

## Development

### Adding a New Page

1. Create a new folder in `src/app/(dashboard)/`
2. Add a `page.tsx` file
3. It will automatically appear in navigation

### Database Updates

For schema changes:
1. Update `schema.sql` with new migrations
2. Run migrations in Supabase SQL editor
3. Update `src/types/index.ts` if adding new tables

### API Routes

All API routes use the service role key from `src/lib/supabase-server.ts` for secure database operations.

## Troubleshooting

### "Incorrect password" on login
- Check that `DASHBOARD_PASSWORD` in `.env.local` matches what you're entering
- Restart the dev server after changing env variables

### 401 Errors on API routes
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is correctly set
- Check that tables exist in Supabase

### Charts not showing
- Verify data exists in the database
- Check browser console for errors
- Ensure Recharts is properly installed

## License

Private project. All rights reserved.
