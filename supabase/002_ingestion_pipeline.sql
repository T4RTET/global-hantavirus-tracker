do $$ begin
  create type source_item_status as enum ('pending', 'processed', 'ignored', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type candidate_status as enum ('confirmed', 'suspected', 'death', 'monitoring', 'official_update', 'irrelevant');
exception when duplicate_object then null; end $$;

create table if not exists source_items (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null unique,
  source_type source_type not null,
  raw_title text not null,
  raw_text text not null,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  content_hash text not null,
  processing_status source_item_status not null default 'pending',
  error text
);

create unique index if not exists source_items_content_hash_idx on source_items(content_hash);
create index if not exists source_items_processing_status_idx on source_items(processing_status);
create index if not exists source_items_published_idx on source_items(published_at desc);

create table if not exists extraction_candidates (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid not null references source_items(id) on delete cascade,
  country_name text,
  country_iso2 text,
  location_name text,
  lat numeric,
  lng numeric,
  disease text not null default 'hantavirus',
  status candidate_status not null,
  confirmed_count integer not null default 0 check (confirmed_count >= 0),
  suspected_count integer not null default 0 check (suspected_count >= 0),
  death_count integer not null default 0 check (death_count >= 0),
  date_reported timestamptz,
  confidence confidence_level not null,
  confidence_reason text not null default '',
  summary text not null default '',
  needs_review boolean not null default false,
  should_affect_totals boolean not null default false,
  event_key text,
  report_id uuid references reports(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists extraction_candidates_review_idx on extraction_candidates(needs_review, created_at desc);
create index if not exists extraction_candidates_event_key_idx on extraction_candidates(event_key);

alter table reports add column if not exists event_key text;
create index if not exists reports_event_key_idx on reports(event_key);

create or replace function recalculate_daily_country_stats()
returns void language plpgsql as $$
begin
  delete from daily_country_stats;

  insert into daily_country_stats (
    country_id, date, confirmed_total, suspected_total, deaths_total,
    new_confirmed, new_suspected, new_deaths
  )
  with daily as (
    select
      country_id,
      report_date::date as date,
      sum(
        case
          when status = 'confirmed' and source_type <> 'social' and confidence <> 'low'
          then case_count
          else 0
        end
      )::int as new_confirmed,
      sum(
        case
          when status = 'suspected' and source_type <> 'social' and confidence <> 'low'
          then suspected_count
          else 0
        end
      )::int as new_suspected,
      sum(
        case
          when status = 'death' and source_type <> 'social' and confidence <> 'low'
          then death_count
          else 0
        end
      )::int as new_deaths
    from reports
    group by country_id, report_date::date
  )
  select
    country_id,
    date,
    sum(new_confirmed) over (partition by country_id order by date)::int as confirmed_total,
    sum(new_suspected) over (partition by country_id order by date)::int as suspected_total,
    sum(new_deaths) over (partition by country_id order by date)::int as deaths_total,
    new_confirmed,
    new_suspected,
    new_deaths
  from daily;
end;
$$;

create or replace view country_rollups as
with latest_stats as (
  select distinct on (country_id)
    country_id,
    confirmed_total,
    suspected_total,
    deaths_total,
    date
  from daily_country_stats
  order by country_id, date desc
),
latest_reports as (
  select distinct on (country_id)
    country_id,
    report_date,
    source_url
  from reports
  order by country_id, report_date desc
)
select
  c.id,
  c.name,
  c.iso2,
  c.iso3,
  c.slug,
  c.lat,
  c.lng,
  coalesce(ls.confirmed_total, 0)::int as confirmed,
  coalesce(ls.suspected_total, 0)::int as suspected,
  coalesce(ls.deaths_total, 0)::int as deaths,
  lr.report_date::text as last_report,
  lr.source_url as source_url
from countries c
left join latest_stats ls on ls.country_id = c.id
left join latest_reports lr on lr.country_id = c.id;
