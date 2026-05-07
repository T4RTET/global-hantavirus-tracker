# Global Hantavirus Tracker

Production-ready MVP for a neutral, source-linked hantavirus dashboard. It separates confirmed, suspected, deaths, monitoring, recovered, and official updates, and every report requires a `source_url`.

## Stack

- Next.js 14 App Router
- TypeScript
- TailwindCSS with shadcn/ui-style local components
- Supabase Postgres
- Leaflet / react-leaflet map
- Recharts timelines
- Vercel cron route for ingestion

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase env vars, the site runs in demo-read mode using clearly marked seed data. Admin mutations and ingestion require Supabase.

## Database Setup

1. Create a Supabase project.
2. Run migrations in order in the Supabase SQL editor:
   - `supabase/001_schema.sql`
   - `supabase/002_ingestion_pipeline.sql`
3. Fill `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=...
ADMIN_PASSWORD=...
```

4. Seed all world countries and demo reports:

```bash
npm run seed
```

Demo reports are marked as low-confidence manual seed data and use `https://example.com/seed-data...` source URLs. Delete them with:

```sql
delete from reports where source_url like 'https://example.com/seed-data%';
select recalculate_daily_country_stats();
```

## Routes

- `/` dashboard with map, KPI cards, ticker, table, timeline, sources, FAQ, disclaimer
- `/country/[slug]` country-specific SEO page
- `/latest` report feed with status filters
- `/about` methodology and source priority
- `/admin?password=...` manual MVP admin
- `/api/og` dynamic social image
- `/api/cron/ingest` protected ingestion route

## API

- `GET /api/stats/global`
- `GET /api/stats/countries`
- `GET /api/reports?country=&status=&limit=`
- `GET /api/countries/[slug]`
- `POST /api/cron/ingest`

Public API responses include short CDN cache headers. The map bundle is dynamically imported client-side.

## Ingestion

The ingestion route:

1. Fetches official public-health sources where accessible: WHO, CDC, and ECDC.
2. Queries GDELT DOC 2.0, Google News RSS, and optional X/Twitter recent search for hantavirus, Andes virus, outbreak/case terms, and basic translated variants.
3. Normalizes fetched records into `source_items`.
4. Deduplicates by `source_url` and normalized title/domain/date `content_hash`.
5. Filters for hantavirus relevance before processing.
6. Extracts structured `extraction_candidates` with deterministic regex first.
7. Optionally uses OpenAI JSON extraction when `OPENAI_API_KEY` is set.
8. Assigns confidence: official is high, reputable news is medium, vague/social signals are low.
9. Inserts reports only when confidence is high/medium and `should_affect_totals=true`.
10. Keeps low-confidence or ambiguous candidates in `/admin/review`.
11. Deduplicates events with `event_key` and updates a lower-confidence report if a better source appears.
12. Recalculates `daily_country_stats`.

Ambiguous reports become `monitoring` and do not affect confirmed totals. Low-confidence and social records are excluded from confirmed rollups.

X/Twitter ingestion is enabled only when `X_BEARER_TOKEN` is set. Tweets are stored as `source_type=social`, assigned low confidence, and sent to `/admin/review`; they are useful for early signals and the news ticker but never update confirmed totals automatically.

Review queue:

```text
/admin/review?password=ADMIN_PASSWORD
```

Review actions:

- approve and add to reports
- edit country, status, date, counts, confidence, and summary
- ignore
- mark duplicate

## Vercel Deploy

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Set all env vars from `.env.example`.
4. Deploy.
5. Vercel reads `vercel.json` and calls `/api/cron/ingest` daily on Hobby accounts. Use Vercel Pro or an external cron service for 15-60 minute ingestion.

For custom cron, send:

```bash
curl -X POST https://your-domain.com/api/cron/ingest \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Production Hardening TODO

- Replace demo seed reports with verified official source URLs before launch.
- Add row-level security policies if exposing Supabase anon reads directly.
- Add stronger admin auth with Supabase Auth, Clerk, or protected Vercel preview auth.
- Expand country/location extraction with a geocoder and alias table.
- Add event-level deduplication beyond source URL/title hash.
- Add moderation workflow for low-confidence monitoring signals.
- Add Playwright smoke tests and Lighthouse CI.
- Add alerting for failed ingestion_runs.
- Add optional OpenAI classification with deterministic fallback prompts and audit logs.
