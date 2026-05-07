export type ReportStatus =
  | "confirmed"
  | "suspected"
  | "death"
  | "monitoring"
  | "recovered"
  | "official_update";

export type CandidateStatus = Exclude<ReportStatus, "recovered"> | "irrelevant";

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
  event_key?: string | null;
  summary: string;
  raw_title: string | null;
  raw_text: string | null;
  created_at: string;
  updated_at: string;
};

export type SourceItem = {
  id: string;
  source_name: string;
  source_url: string;
  source_type: SourceType;
  raw_title: string;
  raw_text: string;
  published_at: string | null;
  fetched_at: string;
  content_hash: string;
  processing_status: "pending" | "processed" | "ignored" | "failed";
  error: string | null;
};

export type ExtractionCandidate = {
  id: string;
  source_item_id: string;
  source_item?: SourceItem;
  country_name: string | null;
  country_iso2: string | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  disease: string;
  status: CandidateStatus;
  confirmed_count: number;
  suspected_count: number;
  death_count: number;
  date_reported: string | null;
  confidence: Confidence;
  confidence_reason: string;
  summary: string;
  needs_review: boolean;
  should_affect_totals?: boolean;
  event_key?: string | null;
  report_id?: string | null;
  created_at: string;
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
