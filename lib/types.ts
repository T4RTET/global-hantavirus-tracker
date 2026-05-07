export type ReportStatus =
  | "confirmed"
  | "suspected"
  | "death"
  | "monitoring"
  | "recovered"
  | "official_update";

export type SourceType = "official" | "news" | "social" | "manual";
export type Confidence = "high" | "medium" | "low";

export type Country = {
  id: string;
  name: string;
  iso2: string;
  iso3: string;
  slug: string;
  lat: number;
  lng: number;
  created_at?: string;
};

export type Report = {
  id: string;
  country_id: string;
  country?: Country;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  status: ReportStatus;
  case_count: number;
  death_count: number;
  suspected_count: number;
  report_date: string;
  source_name: string;
  source_url: string;
  source_type: SourceType;
  confidence: Confidence;
  summary: string;
  raw_title: string | null;
  raw_text: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyCountryStat = {
  id: string;
  country_id: string;
  country?: Country;
  date: string;
  confirmed_total: number;
  suspected_total: number;
  deaths_total: number;
  new_confirmed: number;
  new_suspected: number;
  new_deaths: number;
  created_at: string;
};

export type CountryStats = Country & {
  confirmed: number;
  suspected: number;
  deaths: number;
  last_report: string | null;
  source_url: string | null;
};

export type GlobalStats = {
  confirmed: number;
  suspected: number;
  deaths: number;
  countriesAffected: number;
  lastUpdated: string | null;
  sourceUrls: string[];
};
