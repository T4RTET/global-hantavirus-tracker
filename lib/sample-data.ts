import type { Country, DailyCountryStat, Report } from "@/lib/types";

const now = "2026-05-09T10:00:00.000Z";
const whoMay7Url = "https://www.who.int/news/item/07-05-2026-who-s-response-to-hantavirus-cases-linked-to-a-cruise-ship";
const whoDon599Url = "https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON599";
const manualOverrideUrl = "https://github.com/T4RTET/global-hantavirus-tracker/pull/1#manual-300-case-override";

export const demoCountries: Country[] = [
  { id: "arg", name: "Argentina", iso2: "AR", iso3: "ARG", slug: "argentina", lat: -38.4161, lng: -63.6167 },
  { id: "nld", name: "Netherlands", iso2: "NL", iso3: "NLD", slug: "netherlands", lat: 52.1326, lng: 5.2913 },
  { id: "zaf", name: "South Africa", iso2: "ZA", iso3: "ZAF", slug: "south-africa", lat: -30.5595, lng: 22.9375 }
];

const country = (id: string) => demoCountries.find((item) => item.id === id)!;

export const demoReports: Report[] = [
  {
    id: "who-hondius-confirmed-2026-05-07",
    country_id: "nld",
    country: country("nld"),
    location_name: "MV Hondius multi-country cluster",
    lat: 52.1326,
    lng: 5.2913,
    status: "confirmed",
    case_count: 5,
    death_count: 0,
    suspected_count: 0,
    report_date: "2026-05-07T16:00:00.000Z",
    source_name: "World Health Organization",
    source_url: whoMay7Url,
    source_type: "official",
    confidence: "high",
    summary: "WHO reported eight MV Hondius-linked hantavirus cases as of 7 May 2026, with five confirmed as hantavirus.",
    raw_title: "WHO's response to hantavirus cases linked to a cruise ship",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "who-hondius-suspected-2026-05-07",
    country_id: "nld",
    country: country("nld"),
    location_name: "MV Hondius multi-country cluster",
    lat: 52.1326,
    lng: 5.2913,
    status: "suspected",
    case_count: 0,
    death_count: 0,
    suspected_count: 3,
    report_date: "2026-05-07T16:01:00.000Z",
    source_name: "World Health Organization",
    source_url: `${whoMay7Url}#suspected`,
    source_type: "official",
    confidence: "high",
    summary: "WHO's 7 May update gives eight reported cases total and five confirmed, leaving three reported cases treated as suspected for dashboard totals.",
    raw_title: "WHO's response to hantavirus cases linked to a cruise ship",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "who-hondius-deaths-2026-05-07",
    country_id: "nld",
    country: country("nld"),
    location_name: "MV Hondius multi-country cluster",
    lat: 52.1326,
    lng: 5.2913,
    status: "death",
    case_count: 0,
    death_count: 3,
    suspected_count: 0,
    report_date: "2026-05-07T16:02:00.000Z",
    source_name: "World Health Organization",
    source_url: `${whoMay7Url}#deaths`,
    source_type: "official",
    confidence: "high",
    summary: "WHO reported three deaths in the MV Hondius-linked hantavirus cluster as of 7 May 2026.",
    raw_title: "WHO's response to hantavirus cases linked to a cruise ship",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "manual-hondius-confirmed-adjustment-2026-05-09",
    country_id: "nld",
    country: country("nld"),
    location_name: "MV Hondius multi-country cluster",
    lat: 52.1326,
    lng: 5.2913,
    status: "confirmed",
    case_count: 295,
    death_count: 0,
    suspected_count: 0,
    report_date: "2026-05-09T12:00:00.000Z",
    source_name: "Manual dashboard override",
    source_url: manualOverrideUrl,
    source_type: "manual",
    confidence: "medium",
    summary: "Manual non-WHO adjustment requested by the site owner so the dashboard displays 300 infected/confirmed cases in total.",
    raw_title: "Manual 300-case dashboard override",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "who-argentina-affected-2026-05-04",
    country_id: "arg",
    country: country("arg"),
    location_name: "Ushuaia / pre-boarding exposure investigation",
    lat: -54.8019,
    lng: -68.303,
    status: "monitoring",
    case_count: 0,
    death_count: 0,
    suspected_count: 0,
    report_date: "2026-05-04T12:00:00.000Z",
    source_name: "World Health Organization",
    source_url: whoDon599Url,
    source_type: "official",
    confidence: "high",
    summary: "WHO DON599 states the vessel departed Ushuaia, Argentina, and notes exposure before or during the voyage remains under investigation; Argentina's IHR focal point shared passenger and crew lists.",
    raw_title: "Hantavirus cluster linked to cruise ship travel, Multi-country",
    raw_text: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "who-south-africa-affected-2026-05-04",
    country_id: "zaf",
    country: country("zaf"),
    location_name: "Johannesburg / NICD response",
    lat: -26.2041,
    lng: 28.0473,
    status: "monitoring",
    case_count: 0,
    death_count: 0,
    suspected_count: 0,
    report_date: "2026-05-04T12:01:00.000Z",
    source_name: "World Health Organization",
    source_url: `${whoDon599Url}#south-africa`,
    source_type: "official",
    confidence: "high",
    summary: "WHO DON599 lists South Africa among response countries and says laboratory confirmation was conducted there, with a patient hospitalized in intensive care in South Africa.",
    raw_title: "Hantavirus cluster linked to cruise ship travel, Multi-country",
    raw_text: null,
    created_at: now,
    updated_at: now
  }
];

export const demoDailyStats: DailyCountryStat[] = demoCountries.flatMap((countryItem) => {
  const reports = demoReports.filter((report) => report.country_id === countryItem.id);
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
      country_id: countryItem.id,
      country: countryItem,
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
