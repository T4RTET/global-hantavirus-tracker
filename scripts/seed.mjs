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
const now = "2026-05-09T10:00:00.000Z";
const whoMay7Url = "https://www.who.int/news/item/07-05-2026-who-s-response-to-hantavirus-cases-linked-to-a-cruise-ship";
const whoDon599Url = "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON599";

const demoReports = [
  {
    iso2: "NL",
    location_name: "MV Hondius multi-country cluster",
    lat: 52.1326,
    lng: 5.2913,
    status: "confirmed",
    case_count: 5,
    suspected_count: 0,
    death_count: 0,
    report_date: "2026-05-07T16:00:00.000Z",
    raw_title: "WHO's response to hantavirus cases linked to a cruise ship",
    summary: "WHO reported eight MV Hondius-linked hantavirus cases as of 7 May 2026, with five confirmed as hantavirus.",
    source_url: whoMay7Url,
    source_name: "World Health Organization",
    source_type: "official",
    confidence: "high"
  },
  {
    iso2: "NL",
    location_name: "MV Hondius multi-country cluster",
    lat: 52.1326,
    lng: 5.2913,
    status: "suspected",
    case_count: 0,
    suspected_count: 3,
    death_count: 0,
    report_date: "2026-05-07T16:01:00.000Z",
    raw_title: "WHO's response to hantavirus cases linked to a cruise ship",
    summary: "WHO's 7 May update gives eight reported cases total and five confirmed, leaving three reported cases treated as suspected for dashboard totals.",
    source_url: `${whoMay7Url}#suspected`,
    source_name: "World Health Organization",
    source_type: "official",
    confidence: "high"
  },
  {
    iso2: "NL",
    location_name: "MV Hondius multi-country cluster",
    lat: 52.1326,
    lng: 5.2913,
    status: "death",
    case_count: 0,
    suspected_count: 0,
    death_count: 3,
    report_date: "2026-05-07T16:02:00.000Z",
    raw_title: "WHO's response to hantavirus cases linked to a cruise ship",
    summary: "WHO reported three deaths in the MV Hondius-linked hantavirus cluster as of 7 May 2026.",
    source_url: `${whoMay7Url}#deaths`,
    source_name: "World Health Organization",
    source_type: "official",
    confidence: "high"
  },
  {
    iso2: "AR",
    location_name: "Ushuaia / pre-boarding exposure investigation",
    lat: -54.8019,
    lng: -68.303,
    status: "monitoring",
    case_count: 0,
    suspected_count: 0,
    death_count: 0,
    report_date: "2026-05-04T12:00:00.000Z",
    raw_title: "Hantavirus cluster linked to cruise ship travel, Multi-country",
    summary: "WHO DON599 states the vessel departed Ushuaia, Argentina, and notes exposure before or during the voyage remains under investigation; Argentina's IHR focal point shared passenger and crew lists.",
    source_url: whoDon599Url,
    source_name: "World Health Organization",
    source_type: "official",
    confidence: "high"
  },
  {
    iso2: "ZA",
    location_name: "Johannesburg / NICD response",
    lat: -26.2041,
    lng: 28.0473,
    status: "monitoring",
    case_count: 0,
    suspected_count: 0,
    death_count: 0,
    report_date: "2026-05-04T12:01:00.000Z",
    raw_title: "Hantavirus cluster linked to cruise ship travel, Multi-country",
    summary: "WHO DON599 lists South Africa among response countries and says laboratory confirmation was conducted there, with a patient hospitalized in intensive care in South Africa.",
    source_url: `${whoDon599Url}#south-africa`,
    source_name: "World Health Organization",
    source_type: "official",
    confidence: "high"
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

console.log(`Seeded ${countries.length} countries and ${demoReports.length} WHO-linked reports.`);
console.log("WHO 7 May 2026 reports 8 cases total: 5 confirmed, 3 suspected, 3 deaths. No WHO source found for 300 cases.");
