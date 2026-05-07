import type { Country, DailyCountryStat, Report } from "@/lib/types";

const now = "2026-05-07T09:00:00.000Z";

export const demoCountries: Country[] = [
  { id: "arg", name: "Argentina", iso2: "AR", iso3: "ARG", slug: "argentina", lat: -38.4161, lng: -63.6167 },
  { id: "chl", name: "Chile", iso2: "CL", iso3: "CHL", slug: "chile", lat: -35.6751, lng: -71.543 },
  { id: "che", name: "Switzerland", iso2: "CH", iso3: "CHE", slug: "switzerland", lat: 46.8182, lng: 8.2275 },
  { id: "zaf", name: "South Africa", iso2: "ZA", iso3: "ZAF", slug: "south-africa", lat: -30.5595, lng: 22.9375 },
  { id: "cpv", name: "Cabo Verde", iso2: "CV", iso3: "CPV", slug: "cabo-verde", lat: 16.5388, lng: -23.0418 },
  { id: "esp", name: "Spain", iso2: "ES", iso3: "ESP", slug: "spain", lat: 40.4637, lng: -3.7492 }
];

export const demoReports: Report[] = [
  {
    id: "seed-arg-1",
    country_id: "arg",
    country: demoCountries[0],
    location_name: "Patagonia",
    lat: -41.1335,
    lng: -71.31,
    status: "confirmed",
    case_count: 8,
    death_count: 1,
    suspected_count: 0,
    report_date: "2026-04-22T12:00:00.000Z",
    source_name: "Seed data",
    source_url: "https://example.com/seed-data#argentina",
    source_type: "manual",
    confidence: "low",
    summary: "Demo seed report for UI validation. Replace with verified public source before production use.",
    raw_title: "Seed data: Argentina hantavirus report",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "seed-chl-1",
    country_id: "chl",
    country: demoCountries[1],
    location_name: "Los Lagos",
    lat: -41.47,
    lng: -72.94,
    status: "suspected",
    case_count: 0,
    death_count: 0,
    suspected_count: 6,
    report_date: "2026-04-29T08:30:00.000Z",
    source_name: "Seed data",
    source_url: "https://example.com/seed-data#chile",
    source_type: "manual",
    confidence: "low",
    summary: "Demo suspected cluster used to exercise suspected-only counting.",
    raw_title: "Seed data: Chile suspected reports",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "seed-che-1",
    country_id: "che",
    country: demoCountries[2],
    location_name: "Basel",
    lat: 47.5596,
    lng: 7.5886,
    status: "monitoring",
    case_count: 0,
    death_count: 0,
    suspected_count: 0,
    report_date: "2026-05-02T16:00:00.000Z",
    source_name: "Seed data",
    source_url: "https://example.com/seed-data#switzerland",
    source_type: "manual",
    confidence: "low",
    summary: "Demo monitoring update. Ambiguous reports stay out of confirmed totals.",
    raw_title: "Seed data: Switzerland monitoring",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "seed-zaf-1",
    country_id: "zaf",
    country: demoCountries[3],
    location_name: "Western Cape",
    lat: -33.9,
    lng: 18.42,
    status: "official_update",
    case_count: 0,
    death_count: 0,
    suspected_count: 2,
    report_date: "2026-05-03T11:30:00.000Z",
    source_name: "Seed data",
    source_url: "https://example.com/seed-data#south-africa",
    source_type: "manual",
    confidence: "low",
    summary: "Demo official-update style record; source URL is placeholder seed data.",
    raw_title: "Seed data: South Africa update",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "seed-cpv-1",
    country_id: "cpv",
    country: demoCountries[4],
    location_name: "Praia",
    lat: 14.933,
    lng: -23.513,
    status: "suspected",
    case_count: 0,
    death_count: 0,
    suspected_count: 3,
    report_date: "2026-05-04T10:15:00.000Z",
    source_name: "Seed data",
    source_url: "https://example.com/seed-data#cabo-verde",
    source_type: "manual",
    confidence: "low",
    summary: "Demo suspected entry for map coverage testing.",
    raw_title: "Seed data: Cabo Verde suspected reports",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "seed-esp-1",
    country_id: "esp",
    country: demoCountries[5],
    location_name: "Canary Islands",
    lat: 28.2916,
    lng: -16.6291,
    status: "monitoring",
    case_count: 0,
    death_count: 0,
    suspected_count: 0,
    report_date: "2026-05-05T14:00:00.000Z",
    source_name: "Seed data",
    source_url: "https://example.com/seed-data#canary-islands",
    source_type: "manual",
    confidence: "low",
    summary: "Demo monitoring record linked to travel-report UI testing.",
    raw_title: "Seed data: Canary Islands monitoring",
    raw_text: null,
    created_at: now,
    updated_at: now
  }
];

export const demoDailyStats: DailyCountryStat[] = demoCountries.flatMap((country) => {
  const reports = demoReports.filter((report) => report.country_id === country.id);
  let confirmed = 0;
  let suspected = 0;
  let deaths = 0;
  return reports.map((report) => {
    confirmed += report.case_count;
    suspected += report.suspected_count;
    deaths += report.death_count;
    return {
      id: `stat-${report.id}`,
      country_id: country.id,
      country,
      date: report.report_date.slice(0, 10),
      confirmed_total: confirmed,
      suspected_total: suspected,
      deaths_total: deaths,
      new_confirmed: report.case_count,
      new_suspected: report.suspected_count,
      new_deaths: report.death_count,
      created_at: now
    };
  });
});
