import { createClient } from "@supabase/supabase-js";
import worldCountries from "world-countries";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const countries = worldCountries
  .filter((country) => country.cca2 && country.cca3 && country.latlng?.length === 2)
  .map((country) => ({
    name: country.name.common,
    iso2: country.cca2,
    iso3: country.cca3,
    slug: slugify(country.name.common),
    lat: country.latlng[0],
    lng: country.latlng[1]
  }));

const countryResult = await supabase.from("countries").upsert(countries, { onConflict: "iso2" }).select("id,iso2,name,lat,lng");
if (countryResult.error) throw countryResult.error;

const byIso2 = new Map(countryResult.data.map((country) => [country.iso2, country]));
const now = "2026-05-07T09:00:00.000Z";
const demoReports = [
  {
    iso2: "AR",
    location_name: "Patagonia",
    lat: -41.1335,
    lng: -71.31,
    status: "confirmed",
    case_count: 8,
    suspected_count: 0,
    death_count: 1,
    report_date: "2026-04-22T12:00:00.000Z",
    raw_title: "Seed data: Argentina hantavirus report",
    summary: "Demo seed report for UI validation. Replace with verified public source before production use.",
    source_url: "https://example.com/seed-data#argentina",
    source_name: "Seed data",
    source_type: "manual",
    confidence: "low"
  },
  {
    iso2: "CL",
    location_name: "Los Lagos",
    lat: -41.47,
    lng: -72.94,
    status: "suspected",
    case_count: 0,
    suspected_count: 6,
    death_count: 0,
    report_date: "2026-04-29T08:30:00.000Z",
    raw_title: "Seed data: Chile suspected reports",
    summary: "Demo suspected cluster used to exercise suspected-only counting.",
    source_url: "https://example.com/seed-data#chile",
    source_name: "Seed data",
    source_type: "manual",
    confidence: "low"
  },
  {
    iso2: "CH",
    location_name: "Zurich",
    lat: 47.3769,
    lng: 8.5417,
    status: "confirmed",
    case_count: 1,
    suspected_count: 0,
    death_count: 0,
    report_date: "2026-05-06T12:00:00.000Z",
    raw_title: "Patient with a hantavirus infection being treated in hospital",
    summary: "Swiss authorities reported one positive hantavirus test in a man treated at University Hospital Zurich after MV Hondius travel.",
    source_url: "https://www.blw.admin.ch/en/newnsb/p--A7yPSfxdBqR0N9kZMC",
    source_name: "Swiss Federal Office of Public Health",
    source_type: "official",
    confidence: "high"
  },
  {
    iso2: "IL",
    location_name: "Israel",
    lat: 31.0461,
    lng: 34.8516,
    status: "confirmed",
    case_count: 1,
    suspected_count: 0,
    death_count: 0,
    report_date: "2026-05-07T12:53:00.000Z",
    raw_title: "First case of hantavirus diagnosed in Israel, reported to Health Ministry after visit to Europe",
    summary: "Israeli media reported a first diagnosed hantavirus case in Israel, said to have been reported to the Health Ministry after travel in Eastern Europe.",
    source_url: "https://www.jpost.com/israel-news/article-895478",
    source_name: "The Jerusalem Post",
    source_type: "news",
    confidence: "medium"
  },
  {
    iso2: "NL",
    location_name: "Netherlands-linked MV Hondius case",
    lat: 52.1326,
    lng: 5.2913,
    status: "confirmed",
    case_count: 1,
    suspected_count: 0,
    death_count: 0,
    report_date: "2026-05-05T07:08:00.000Z",
    raw_title: "WHO: Now 7 hantavirus infections on Dutch cruise ship, incl. 3 dead",
    summary: "Netherlands-linked reporting says a Dutch woman connected to the MV Hondius outbreak tested positive for hantavirus; this is travel-linked, not proof of local spread.",
    source_url: "https://nltimes.nl/2026/05/05/now-7-hantavirus-infections-dutch-cruise-ship-incl-3-dead",
    source_name: "NL Times",
    source_type: "news",
    confidence: "medium"
  },
  {
    iso2: "FR",
    location_name: "France",
    lat: 46.2276,
    lng: 2.2137,
    status: "confirmed",
    case_count: 1,
    suspected_count: 0,
    death_count: 0,
    report_date: "2026-05-07T13:00:00.000Z",
    raw_title: "Manual tracker entry: France hantavirus highlight",
    summary: "Manual demo entry added to highlight France on the map. Replace with a verified source URL before production use.",
    source_url: "https://example.com/seed-data#france",
    source_name: "Manual tracker entry",
    source_type: "manual",
    confidence: "medium"
  },
  {
    iso2: "ZA",
    location_name: "Western Cape",
    lat: -33.9,
    lng: 18.42,
    status: "official_update",
    case_count: 0,
    suspected_count: 2,
    death_count: 0,
    report_date: "2026-05-03T11:30:00.000Z",
    raw_title: "Seed data: South Africa update",
    summary: "Demo official-update style record; source URL is placeholder seed data.",
    source_url: "https://example.com/seed-data#south-africa",
    source_name: "Seed data",
    source_type: "manual",
    confidence: "low"
  },
  {
    iso2: "CV",
    location_name: "Praia",
    lat: 14.933,
    lng: -23.513,
    status: "suspected",
    case_count: 0,
    suspected_count: 3,
    death_count: 0,
    report_date: "2026-05-04T10:15:00.000Z",
    raw_title: "Seed data: Cabo Verde suspected reports",
    summary: "Demo suspected entry for map coverage testing.",
    source_url: "https://example.com/seed-data#cabo-verde",
    source_name: "Seed data",
    source_type: "manual",
    confidence: "low"
  },
  {
    iso2: "ES",
    location_name: "Canary Islands",
    lat: 28.2916,
    lng: -16.6291,
    status: "monitoring",
    case_count: 0,
    suspected_count: 0,
    death_count: 0,
    report_date: "2026-05-05T14:00:00.000Z",
    raw_title: "Seed data: Canary Islands monitoring",
    summary: "Demo monitoring record linked to travel-report UI testing.",
    source_url: "https://example.com/seed-data#canary-islands",
    source_name: "Seed data",
    source_type: "manual",
    confidence: "low"
  }
].map((report) => ({
  country_id: byIso2.get(report.iso2)?.id,
  location_name: report.location_name,
  lat: report.lat,
  lng: report.lng,
  status: report.status,
  case_count: report.case_count,
  suspected_count: report.suspected_count,
  death_count: report.death_count,
  report_date: report.report_date,
  source_name: report.source_name,
  source_url: report.source_url,
  source_type: report.source_type,
  confidence: report.confidence,
  summary: report.summary,
  raw_title: report.raw_title,
  raw_text: null,
  created_at: now,
  updated_at: now
}));

const reportResult = await supabase.from("reports").upsert(demoReports, { onConflict: "source_url" });
if (reportResult.error) throw reportResult.error;

const rpc = await supabase.rpc("recalculate_daily_country_stats");
if (rpc.error) throw rpc.error;

console.log(`Seeded ${countries.length} countries and ${demoReports.length} demo reports.`);
console.log("Delete demo reports with: delete from reports where source_url like 'https://example.com/seed-data%';");
