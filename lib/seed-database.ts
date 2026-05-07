import worldCountries from "world-countries";
import { demoReports } from "@/lib/sample-data";
import { getSupabaseService } from "@/lib/supabase";
import type { Confidence, ReportStatus, SourceType } from "@/lib/types";

type SeedReport = {
  country_id: string;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  status: ReportStatus;
  case_count: number;
  suspected_count: number;
  death_count: number;
  report_date: string;
  source_name: string;
  source_url: string;
  source_type: SourceType;
  confidence: Confidence;
  summary: string;
  raw_title: string | null;
  raw_text: string | null;
  updated_at: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function seedSupabaseDatabase() {
  const supabase = getSupabaseService();
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

  const countryResult = await supabase
    .from("countries")
    .upsert(countries, { onConflict: "iso2" })
    .select("id,iso2");
  if (countryResult.error) throw countryResult.error;

  const byIso2 = new Map((countryResult.data ?? []).map((country) => [country.iso2, country.id]));
  const reports = demoReports
    .map((report) => {
      const countryId = report.country?.iso2 ? byIso2.get(report.country.iso2) : null;
      if (!countryId) return null;
      return {
        country_id: countryId,
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
        raw_text: report.raw_text,
        updated_at: new Date().toISOString()
      };
    })
    .filter((report): report is SeedReport => Boolean(report));

  const reportResult = await supabase.from("reports").upsert(reports, { onConflict: "source_url" });
  if (reportResult.error) throw reportResult.error;

  const rpc = await supabase.rpc("recalculate_daily_country_stats");
  if (rpc.error) throw rpc.error;

  return {
    countries: countries.length,
    reports: reports.length
  };
}
