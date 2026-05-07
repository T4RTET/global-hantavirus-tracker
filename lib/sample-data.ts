import type { Country, DailyCountryStat, Report } from "@/lib/types";

const now = "2026-05-07T09:00:00.000Z";

export const demoCountries: Country[] = [
  { id: "arg", name: "Argentina", iso2: "AR", iso3: "ARG", slug: "argentina", lat: -38.4161, lng: -63.6167 },
  { id: "chl", name: "Chile", iso2: "CL", iso3: "CHL", slug: "chile", lat: -35.6751, lng: -71.543 },
  { id: "che", name: "Switzerland", iso2: "CH", iso3: "CHE", slug: "switzerland", lat: 46.8182, lng: 8.2275 },
  { id: "isr", name: "Israel", iso2: "IL", iso3: "ISR", slug: "israel", lat: 31.0461, lng: 34.8516 },
  { id: "nld", name: "Netherlands", iso2: "NL", iso3: "NLD", slug: "netherlands", lat: 52.1326, lng: 5.2913 },
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
    location_name: "Zurich",
    lat: 47.3769,
    lng: 8.5417,
    status: "confirmed",
    case_count: 1,
    death_count: 0,
    suspected_count: 0,
    report_date: "2026-05-06T12:00:00.000Z",
    source_name: "Swiss Federal Office of Public Health",
    source_url: "https://www.blw.admin.ch/en/newnsb/p--A7yPSfxdBqR0N9kZMC",
    source_type: "official",
    confidence: "high",
    summary: "Swiss authorities reported one positive hantavirus test in a man treated at University Hospital Zurich after MV Hondius travel.",
    raw_title: "Patient with a hantavirus infection being treated in hospital",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "seed-isr-1",
    country_id: "isr",
    country: demoCountries[3],
    location_name: "Israel",
    lat: 31.0461,
    lng: 34.8516,
    status: "confirmed",
    case_count: 1,
    death_count: 0,
    suspected_count: 0,
    report_date: "2026-05-07T12:53:00.000Z",
    source_name: "The Jerusalem Post",
    source_url: "https://www.jpost.com/israel-news/article-895478",
    source_type: "news",
    confidence: "medium",
    summary: "Israeli media reported a first diagnosed hantavirus case in Israel, said to have been reported to the Health Ministry after travel in Eastern Europe.",
    raw_title: "First case of hantavirus diagnosed in Israel, reported to Health Ministry after visit to Europe",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "seed-nld-1",
    country_id: "nld",
    country: demoCountries[4],
    location_name: "Netherlands-linked MV Hondius case",
    lat: 52.1326,
    lng: 5.2913,
    status: "confirmed",
    case_count: 1,
    death_count: 0,
    suspected_count: 0,
    report_date: "2026-05-05T07:08:00.000Z",
    source_name: "NL Times",
    source_url: "https://nltimes.nl/2026/05/05/now-7-hantavirus-infections-dutch-cruise-ship-incl-3-dead",
    source_type: "news",
    confidence: "medium",
    summary: "Netherlands-linked reporting says a Dutch woman connected to the MV Hondius outbreak tested positive for hantavirus; this is travel-linked, not proof of local spread.",
    raw_title: "WHO: Now 7 hantavirus infections on Dutch cruise ship, incl. 3 dead",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "seed-zaf-1",
    country_id: "zaf",
    country: demoCountries[5],
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
    country: demoCountries[6],
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
    country: demoCountries[7],
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
    const countsForTotals = report.source_type !== "social" && report.confidence !== "low";
    const newConfirmed = countsForTotals && report.status === "confirmed" ? report.case_count : 0;
    const newSuspected = countsForTotals && report.status === "suspected" ? report.suspected_count : 0;
    const newDeaths = countsForTotals && report.status === "death" ? report.death_count : 0;
    confirmed += newConfirmed;
    suspected += newSuspected;
    deaths += newDeaths;
    return {
      id: `stat-${report.id}`,
      country_id: country.id,
      country,
      date: report.report_date.slice(0, 10),
      confirmed_total: confirmed,
      suspected_total: suspected,
      deaths_total: deaths,
      new_confirmed: newConfirmed,
      new_suspected: newSuspected,
      new_deaths: newDeaths,
      created_at: now
    };
  });
});
