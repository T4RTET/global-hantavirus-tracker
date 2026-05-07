import crypto from "node:crypto";
import { getSupabaseService, hasSupabaseEnv } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import type { Confidence, Country, ReportStatus, SourceType } from "@/lib/types";

type CandidateReport = {
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
  source_hash: string;
};

type GdeltArticle = {
  title?: string;
  url?: string;
  seendate?: string;
  sourcecountry?: string;
  domain?: string;
};

const officialSources = [
  {
    name: "WHO Disease Outbreak News",
    url: "https://www.who.int/rss-feeds/news-english.xml",
    sourceType: "official" as SourceType
  },
  {
    name: "CDC Hantavirus",
    url: "https://www.cdc.gov/hantavirus/",
    sourceType: "official" as SourceType
  },
  {
    name: "ECDC",
    url: "https://www.ecdc.europa.eu/en/search?search=hantavirus",
    sourceType: "official" as SourceType
  },
  {
    name: "Africa CDC",
    url: "https://africacdc.org/?s=hantavirus",
    sourceType: "official" as SourceType
  }
];

function hash(value: string) {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

function detectNumbers(text: string) {
  const lower = text.toLowerCase();
  const number = (pattern: RegExp) => {
    const match = lower.match(pattern);
    return match ? Number(match[1]) : 0;
  };

  const death_count = number(/(\d{1,5})\s+(?:death|deaths|fatalit|died)/);
  const suspected_count = number(/(\d{1,5})\s+(?:suspected|probable)/);
  const case_count = lower.includes("confirmed") ? number(/(\d{1,5})\s+(?:confirmed\s+)?cases?/) : 0;

  let status: ReportStatus = "monitoring";
  if (death_count > 0) status = "death";
  if (suspected_count > 0 && case_count === 0) status = "suspected";
  if (case_count > 0 || /\bconfirmed\b/.test(lower)) status = "confirmed";
  if (/\bmonitoring\b|\binvestigat/.test(lower) && case_count === 0 && suspected_count === 0) status = "monitoring";

  return { status, death_count, suspected_count, case_count };
}

function sourceConfidence(sourceType: SourceType, text: string): Confidence {
  if (sourceType === "official") return "high";
  if (/facebook|twitter|x\.com|telegram|reddit/i.test(text)) return "low";
  return "medium";
}

function findCountry(countries: Country[], text: string) {
  const lower = text.toLowerCase();
  return countries.find((country) => {
    const candidates = [country.name, country.iso2, country.iso3, country.slug.replace(/-/g, " ")].map((item) => item.toLowerCase());
    return candidates.some((candidate) => candidate.length > 2 && lower.includes(candidate));
  });
}

async function loadCountries(): Promise<Country[]> {
  if (!hasSupabaseEnv()) return [];
  const { data, error } = await getSupabaseService().from("countries").select("*");
  if (error) throw error;
  return (data ?? []) as Country[];
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "GlobalHantavirusTracker/0.1" },
    next: { revalidate: 900 }
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

function rssItems(xml: string) {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((match) => {
    const item = match[1];
    const pick = (tag: string) => item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    return {
      title: pick("title") ?? "Untitled update",
      url: pick("link") ?? "",
      date: pick("pubDate") ?? new Date().toISOString(),
      text: `${pick("title") ?? ""} ${pick("description") ?? ""}`
    };
  });
}

function candidateFromText(input: {
  title: string;
  text: string;
  url: string;
  date: string;
  sourceName: string;
  sourceType: SourceType;
  countries: Country[];
}): CandidateReport | null {
  const combined = `${input.title} ${input.text}`;
  if (!/hantavirus|andes virus/i.test(combined)) return null;
  const country = findCountry(input.countries, combined);
  if (!country) return null;
  const counts = detectNumbers(combined);
  const confidence = sourceConfidence(input.sourceType, combined);

  return {
    country,
    location_name: null,
    lat: country.lat,
    lng: country.lng,
    ...counts,
    report_date: new Date(input.date).toISOString(),
    source_name: input.sourceName,
    source_url: input.url,
    source_type: input.sourceType,
    confidence,
    summary: input.title.slice(0, 280),
    raw_title: input.title,
    raw_text: input.text.slice(0, 2000),
    source_hash: hash(`${input.url}|${input.title}`)
  };
}

async function fetchOfficialCandidates(countries: Country[]) {
  const candidates: CandidateReport[] = [];
  for (const source of officialSources) {
    try {
      const text = await fetchText(source.url);
      const items = source.url.includes("rss") ? rssItems(text) : [{ title: source.name, url: source.url, date: new Date().toISOString(), text }];
      for (const item of items) {
        const candidate = candidateFromText({
          title: item.title,
          text: item.text,
          url: item.url || source.url,
          date: item.date,
          sourceName: source.name,
          sourceType: source.sourceType,
          countries
        });
        if (candidate) candidates.push(candidate);
      }
    } catch {
      // Individual source failures are recorded in ingestion_runs.
    }
  }
  return candidates;
}

async function fetchGdeltCandidates(countries: Country[]) {
  const query = encodeURIComponent('(hantavirus OR "Andes virus" OR "hantavirus outbreak" OR "hantavirus cruise ship")');
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=50&sort=HybridRel`;
  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) throw new Error(`GDELT returned ${response.status}`);
  const payload = (await response.json()) as { articles?: GdeltArticle[] };

  return (payload.articles ?? [])
    .map((article) =>
      candidateFromText({
        title: article.title ?? "Hantavirus news signal",
        text: article.title ?? "",
        url: article.url ?? `https://${article.domain ?? "gdeltproject.org"}/${hash(article.title ?? "untitled")}`,
        date: article.seendate ?? new Date().toISOString(),
        sourceName: article.domain ? `GDELT / ${article.domain}` : "GDELT",
        sourceType: "news",
        countries
      })
    )
    .filter(Boolean) as CandidateReport[];
}

export async function runIngestion() {
  if (!hasSupabaseEnv()) {
    return { status: "failed", items_found: 0, items_inserted: 0, error: "Supabase env vars are required for ingestion." };
  }

  const supabase = getSupabaseService();
  const startedAt = new Date().toISOString();
  const runInsert = await supabase
    .from("ingestion_runs")
    .insert({ source: "official+gdelt", status: "partial", started_at: startedAt, items_found: 0, items_inserted: 0 })
    .select("id")
    .single();

  const runId = runInsert.data?.id;
  try {
    const countries = await loadCountries();
    const [official, gdelt] = await Promise.all([fetchOfficialCandidates(countries), fetchGdeltCandidates(countries)]);
    const candidates = [...official, ...gdelt];
    const sourceHashes = candidates.map((candidate) => candidate.source_hash);
    const { data: existing } = await supabase.from("reports").select("source_hash").in("source_hash", sourceHashes);
    const seen = new Set((existing ?? []).map((row) => row.source_hash));
    const inserts = candidates
      .filter((candidate) => !seen.has(candidate.source_hash))
      .map(({ country, source_hash, ...candidate }) => ({ ...candidate, country_id: country!.id }));

    if (inserts.length > 0) {
      const { error } = await supabase.from("reports").insert(inserts);
      if (error) throw error;
    }

    await supabase.rpc("recalculate_daily_country_stats");

    const result = { status: "success", items_found: candidates.length, items_inserted: inserts.length, error: null };
    if (runId) {
      await supabase
        .from("ingestion_runs")
        .update({ ...result, finished_at: new Date().toISOString() })
        .eq("id", runId);
    }
    return result;
  } catch (error) {
    const result = {
      status: "failed",
      items_found: 0,
      items_inserted: 0,
      error: error instanceof Error ? error.message : "Unknown ingestion error"
    };
    if (runId) {
      await supabase
        .from("ingestion_runs")
        .update({ ...result, finished_at: new Date().toISOString() })
        .eq("id", runId);
    }
    return result;
  }
}

export function inferCountrySlug(name: string) {
  return slugify(name);
}
