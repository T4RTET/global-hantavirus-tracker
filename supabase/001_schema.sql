create extension if not exists "pgcrypto";

do $$ begin
  create type report_status as enum ('confirmed', 'suspected', 'death', 'monitoring', 'recovered', 'official_update');
exception when duplicate_object then null; end $$;

do $$ begin
  create type source_type as enum ('official', 'news', 'social', 'manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type confidence_level as enum ('high', 'medium', 'low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ingestion_status as enum ('success', 'partial', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  iso2 text not null unique,
  iso3 text not null unique,
  slug text not null unique,
  lat numeric not null,
  lng numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade,
  location_name text,
  lat numeric,
  lng numeric,
  status report_status not null,
  case_count integer not null default 0 check (case_count >= 0),
  death_count integer not null default 0 check (death_count >= 0),
  suspected_count integer not null default 0 check (suspected_count >= 0),
  report_date timestamptz not null,
  source_name text not null,
  source_url text not null,
  source_type source_type not null,
  confidence confidence_level not null,
  summary text not null,
  raw_title text,
  raw_text text,
  source_hash text generated always as (encode(sha256(lower(coalesce(source_url, '') || '|' || coalesce(raw_title, ''))::bytea), 'hex')) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reports_source_url_idx on reports(source_url);
create unique index if not exists reports_source_hash_idx on reports(source_hash);
create index if not exists reports_country_date_idx on reports(country_id, report_date desc);
create index if not exists reports_status_idx on reports(status);

create table if not exists daily_country_stats (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade,
  date date not null,
  confirmed_total integer not null default 0,
  suspected_total integer not null default 0,
  deaths_total integer not null default 0,
  new_confirmed integer not null default 0,
  new_suspected integer not null default 0,
  new_deaths integer not null default 0,
  created_at timestamptz not null default now(),
  unique(country_id, date)
);

create table if not exists ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status ingestion_status not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  items_found integer not null default 0,
  items_inserted integer not null default 0,
  error text
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_set_updated_at on reports;
create trigger reports_set_updated_at
before update on reports
for each row execute function set_updated_at();

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
      sum(case when source_type <> 'social' and confidence <> 'low' then case_count else 0 end)::int as new_confirmed,
      sum(suspected_count)::int as new_suspected,
      sum(death_count)::int as new_deaths
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
select
  c.id,
  c.name,
  c.iso2,
  c.iso3,
  c.slug,
  c.lat,
  c.lng,
  coalesce(sum(case when r.source_type <> 'social' and r.confidence <> 'low' then r.case_count else 0 end), 0)::int as confirmed,
  coalesce(sum(r.suspected_count), 0)::int as suspected,
  coalesce(sum(r.death_count), 0)::int as deaths,
  max(r.report_date)::text as last_report,
  (array_agg(r.source_url order by r.report_date desc) filter (where r.source_url is not null))[1] as source_url
from countries c
left join reports r on r.country_id = c.id
group by c.id;
