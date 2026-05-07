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
  ["AR", "Patagonia", -41.1335, -71.31, "confirmed", 8, 0, 1, "2026-04-22T12:00:00.000Z", "Seed data: Argentina hantavirus report", "Demo seed report for UI validation. Replace with verified public source before production use.", "https://example.com/seed-data#argentina"],
  ["CL", "Los Lagos", -41.47, -72.94, "suspected", 0, 6, 0, "2026-04-29T08:30:00.000Z", "Seed data: Chile suspected reports", "Demo suspected cluster used to exercise suspected-only counting.", "https://example.com/seed-data#chile"],
  ["CH", "Basel", 47.5596, 7.5886, "monitoring", 0, 0, 0, "2026-05-02T16:00:00.000Z", "Seed data: Switzerland monitoring", "Demo monitoring update. Ambiguous reports stay out of confirmed totals.", "https://example.com/seed-data#switzerland"],
  ["ZA", "Western Cape", -33.9, 18.42, "official_update", 0, 2, 0, "2026-05-03T11:30:00.000Z", "Seed data: South Africa update", "Demo official-update style record; source URL is placeholder seed data.", "https://example.com/seed-data#south-africa"],
  ["CV", "Praia", 14.933, -23.513, "suspected", 0, 3, 0, "2026-05-04T10:15:00.000Z", "Seed data: Cabo Verde suspected reports", "Demo suspected entry for map coverage testing.", "https://example.com/seed-data#cabo-verde"],
  ["ES", "Canary Islands", 28.2916, -16.6291, "monitoring", 0, 0, 0, "2026-05-05T14:00:00.000Z", "Seed data: Canary Islands monitoring", "Demo monitoring record linked to travel-report UI testing.", "https://example.com/seed-data#canary-islands"]
].map(([iso2, location_name, lat, lng, status, case_count, suspected_count, death_count, report_date, raw_title, summary, source_url]) => ({
  country_id: byIso2.get(iso2)?.id,
  location_name,
  lat,
  lng,
  status,
  case_count,
  suspected_count,
  death_count,
  report_date,
  source_name: "Seed data",
  source_url,
  source_type: "manual",
  confidence: "low",
  summary,
  raw_title,
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
