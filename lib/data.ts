import { unstable_noStore as noStore } from "next/cache";
import { demoCountries, demoDailyStats, demoReports } from "@/lib/sample-data";
import { getSupabaseService, hasSupabaseEnv } from "@/lib/supabase";
import type { CountryStats, DailyCountryStat, GlobalStats, Report, ReportStatus } from "@/lib/types";

function withCountry(report: Report): Report {
  return report.country ? report : { ...report, country: demoCountries.find((country) => country.id === report.country_id) };
}

function getDemoCountryStats(): CountryStats[] {
  return demoCountries
    .map((country) => {
      const reports = demoReports.filter((report) => report.country_id === country.id);
      return {
        ...country,
        confirmed: reports.reduce(
          (sum, report) => sum + (report.source_type !== "social" && report.confidence !== "low" ? report.case_count : 0),
          0
        ),
        suspected: reports.reduce((sum, report) => sum + report.suspected_count, 0),
        deaths: reports.reduce((sum, report) => sum + report.death_count, 0),
        last_report: reports.map((report) => report.report_date).sort().at(-1) ?? null,
        source_url: reports.at(-1)?.source_url ?? null
      };
    })
    .filter((country) => country.confirmed + country.suspected + country.deaths > 0);
}

export async function getReports(options: {
  country?: string;
  status?: ReportStatus | "all";
  limit?: number;
} = {}): Promise<Report[]> {
  const limit = options.limit ?? 50;
  if (!hasSupabaseEnv()) {
    return demoReports
      .map(withCountry)
      .filter((report) => !options.country || report.country?.slug === options.country)
      .filter((report) => !options.status || options.status === "all" || report.status === options.status)
      .sort((a, b) => Date.parse(b.report_date) - Date.parse(a.report_date))
      .slice(0, limit);
  }

  const supabase = getSupabaseService();
  let query = supabase
    .from("reports")
    .select("*, country:countries(*)")
    .order("report_date", { ascending: false })
    .limit(limit);

  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.country) {
    const { data: country } = await supabase.from("countries").select("id").eq("slug", options.country).single();
    if (!country) return [];
    query = query.eq("country_id", country.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Report[];
}

export async function getCountryStats(): Promise<CountryStats[]> {
  if (!hasSupabaseEnv()) return getDemoCountryStats();

  const supabase = getSupabaseService();
  const { data, error } = await supabase.from("country_rollups").select("*").order("confirmed", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CountryStats[];
}

export async function getCountries() {
  if (!hasSupabaseEnv()) return demoCountries;

  const { data, error } = await getSupabaseService().from("countries").select("*").order("name");
  if (error) throw error;
  return data ?? [];
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
  if (error) return null;
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
  return (data ?? []) as DailyCountryStat[];
}

export function markDynamic() {
  noStore();
}
