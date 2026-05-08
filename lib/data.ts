import { unstable_noStore as noStore } from "next/cache";
import { demoCountries, demoDailyStats, demoReports } from "@/lib/sample-data";
import { getSupabaseService, hasSupabaseEnv } from "@/lib/supabase";
import type { CountryStats, DailyCountryStat, ExtractionCandidate, GlobalStats, Report, ReportStatus } from "@/lib/types";

function withCountry(report: Report): Report {
  return report.country ? report : { ...report, country: demoCountries.find((country) => country.id === report.country_id) };
}

function reportRank(report: Report) {
  const sourceRank = report.source_type === "official" ? 0 : report.source_type === "news" ? 1 : report.source_type === "manual" ? 2 : 3;
  const confidenceRank = report.confidence === "high" ? 0 : report.confidence === "medium" ? 1 : 2;
  return sourceRank * 10 + confidenceRank;
}

function sortReports(reports: Report[]) {
  return [...reports].sort((a, b) => {
    const aManualWatch = a.source_type === "manual" && a.confidence === "low";
    const bManualWatch = b.source_type === "manual" && b.confidence === "low";
    if (aManualWatch !== bManualWatch) return aManualWatch ? 1 : -1;
    const dateDelta = Date.parse(b.report_date) - Date.parse(a.report_date);
    if (dateDelta !== 0) return dateDelta;
    return reportRank(a) - reportRank(b);
  });
}

function getDemoReports(options: {
  country?: string;
  status?: ReportStatus | "all";
  limit?: number;
} = {}) {
  const limit = options.limit ?? 50;
  return sortReports(demoReports
    .map(withCountry)
    .filter((report) => !options.country || report.country?.slug === options.country)
    .filter((report) => !options.status || options.status === "all" || report.status === options.status))
    .slice(0, limit);
}

function getDemoCountryStats(): CountryStats[] {
  return demoCountries
    .map((country) => {
      const reports = demoReports.filter((report) => report.country_id === country.id);
      return {
        ...country,
        confirmed: reports.reduce(
          (sum, report) => sum + (report.status === "confirmed" && report.source_type !== "social" && report.confidence !== "low" ? report.case_count : 0),
          0
        ),
        suspected: reports.reduce(
          (sum, report) => sum + (report.status === "suspected" && report.source_type !== "social" && report.confidence !== "low" ? report.suspected_count : 0),
          0
        ),
        deaths: reports.reduce(
          (sum, report) => sum + (report.status === "death" && report.source_type !== "social" && report.confidence !== "low" ? report.death_count : 0),
          0
        ),
        last_report: reports.map((report) => report.report_date).sort().at(-1) ?? null,
        source_url: reports.at(-1)?.source_url ?? null
      };
    })
    .filter((country) => demoReports.some((report) => report.country_id === country.id));
}

export async function getReports(options: {
  country?: string;
  status?: ReportStatus | "all";
  limit?: number;
} = {}): Promise<Report[]> {
  const limit = options.limit ?? 50;
  if (!hasSupabaseEnv()) {
    return getDemoReports(options);
  }

  const supabase = getSupabaseService();
  let query = supabase
    .from("reports")
    .select("*, country:countries(*)")
    .order("report_date", { ascending: false })
    .limit(Math.max(limit, 200));

  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.country) {
    const { data: country } = await supabase.from("countries").select("id").eq("slug", options.country).single();
    if (!country) return [];
    query = query.eq("country_id", country.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  const reports = (data ?? []) as Report[];
  return reports.length > 0 ? sortReports(reports).slice(0, limit) : getDemoReports(options);
}

export async function getCountryStats(): Promise<CountryStats[]> {
  if (!hasSupabaseEnv()) return getDemoCountryStats();

  const supabase = getSupabaseService();
  const { data, error } = await supabase.from("country_rollups").select("*").order("confirmed", { ascending: false });
  if (error) throw error;
  const countryStats = (data ?? []) as CountryStats[];
  const hasReportStats = countryStats.some((country) => country.confirmed + country.suspected + country.deaths > 0);
  return hasReportStats ? countryStats : getDemoCountryStats();
}

export async function getCountries() {
  if (!hasSupabaseEnv()) return demoCountries;

  const { data, error } = await getSupabaseService().from("countries").select("*").order("name");
  if (error) throw error;
  return data?.length ? data : demoCountries;
}

export async function getReviewCandidates(limit = 50): Promise<ExtractionCandidate[]> {
  if (!hasSupabaseEnv()) return [];

  const { data, error } = await getSupabaseService()
    .from("extraction_candidates")
    .select("*, source_item:source_items(*)")
    .eq("needs_review", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ExtractionCandidate[];
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const countryStats = await getCountryStats();
  const reports = await getReports({ limit: 200 });
  const affected = countryStats.filter((country) => country.confirmed + country.suspected + country.deaths > 0);

  return {
    confirmed: countryStats.reduce((sum, country) => sum + country.confirmed, 0),
    suspected: countryStats.reduce((sum, country) => sum + country.suspected, 0),
    deaths: countryStats.reduce((sum, country) => sum + country.deaths, 0),
    countriesAffected: affected.length,
    lastUpdated: reports[0]?.updated_at ?? reports[0]?.report_date ?? null,
    sourceUrls: Array.from(new Set(reports.map((report) => report.source_url))).slice(0, 12)
  };
}

export async function getCountryBySlug(slug: string) {
  if (!hasSupabaseEnv()) return getDemoCountryStats().find((country) => country.slug === slug) ?? null;

  const supabase = getSupabaseService();
  const { data, error } = await supabase.from("country_rollups").select("*").eq("slug", slug).single();
  if (error) return getDemoCountryStats().find((country) => country.slug === slug) ?? null;
  if (!data || Number(data.confirmed ?? 0) + Number(data.suspected ?? 0) + Number(data.deaths ?? 0) === 0) {
    return getDemoCountryStats().find((country) => country.slug === slug) ?? null;
  }
  return data as CountryStats;
}

export async function getDailyStats(countrySlug?: string): Promise<DailyCountryStat[]> {
  if (!hasSupabaseEnv()) {
    return demoDailyStats
      .filter((stat) => !countrySlug || stat.country?.slug === countrySlug)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  const supabase = getSupabaseService();
  let query = supabase.from("daily_country_stats").select("*, country:countries(*)").order("date");
  if (countrySlug) {
    const { data: country } = await supabase.from("countries").select("id").eq("slug", countrySlug).single();
    if (!country) return [];
    query = query.eq("country_id", country.id);
  }
  const { data, error } = await query;
  if (error) throw error;
  const stats = (data ?? []) as DailyCountryStat[];
  return stats.length > 0
    ? stats
    : demoDailyStats
      .filter((stat) => !countrySlug || stat.country?.slug === countrySlug)
      .sort((a, b) => a.date.localeCompare(b.date));
}

export function markDynamic() {
  noStore();
}
