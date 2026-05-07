import crypto from "node:crypto";
import { getSupabaseService, hasSupabaseEnv } from "@/lib/supabase";
import type { CandidateStatus, Confidence, Country, ReportStatus, SourceType } from "@/lib/types";

type NormalizedSourceItem = {
  source_name: string;
  source_url: string;
  source_type: SourceType;
  raw_title: string;
  raw_text: string;
  published_at: string | null;
  content_hash: string;
};

type ExtractedReportData = {
  is_relevant: boolean;
  disease: string;
  country: string | null;
  country_iso2: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  status: CandidateStatus;
  confirmed_count: number;
  suspected_count: number;
  death_count: number;
  date_reported: string | null;
  summary: string;
  confidence: Confidence;
  confidence_reason: string;
  should_affect_totals: boolean;
};

type GdeltArticle = {
  title?: string;
  url?: string;
  seendate?: string;
  sourcecountry?: string;
  domain?: string;
  language?: string;
};

type XUser = {
  id: string;
  name?: string;
  username?: string;
  verified?: boolean;
};

type XTweet = {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
  lang?: string;
};

type XRecentSearchResponse = {
  data?: XTweet[];
  includes?: { users?: XUser[] };
};

const searchQueries = [
  "hantavirus",
  "\"hantavirus outbreak\"",
  "\"hantavirus cases\"",
  "\"Andes virus\"",
  "\"hantavirus pulmonary syndrome\"",
  "\"hantavirus cruise ship\"",
  "\"hantavirus casos\"",
  "\"virus hanta\"",
  "\"hantavirus décès\"",
  "\"hantavirus casos confirmados\""
];

const relevanceTerms = [
  "hantavirus",
  "hanta virus",
  "andes virus",
  "hantavirus pulmonary syndrome",
  "hps",
  "virus hanta"
];

const agencyTerms = [
  "who",
  "world health organization",
  "cdc",
  "ecdc",
  "africa cdc",
  "ministry of health",
  "health department",
  "public health",
  "secretaria de salud",
  "ministerio de salud"
];

const confidenceRank: Record<Confidence, number> = { low: 1, medium: 2, high: 3 };

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

function normalizeText(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function safeDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function contentHash(title: string, url: string, publishedAt: string | null) {
  const day = publishedAt ? publishedAt.slice(0, 10) : "undated";
  return sha256(`${normalizeText(title).toLowerCase()}|${getDomain(url)}|${day}`);
}

function isRelevantText(title: string, text: string) {
  const combined = `${title} ${text}`.toLowerCase();
  return relevanceTerms.some((term) => combined.includes(term));
}

function normalizeSourceItem(input: Omit<NormalizedSourceItem, "content_hash">): NormalizedSourceItem | null {
  const rawTitle = normalizeText(input.raw_title);
  const rawText = normalizeText(input.raw_text || input.raw_title);
  if (!input.source_url || !rawTitle || !isRelevantText(rawTitle, rawText)) return null;
  const publishedAt = safeDate(input.published_at);

  return {
    ...input,
    raw_title: rawTitle,
    raw_text: rawText.slice(0, 6000),
    published_at: publishedAt,
    content_hash: contentHash(rawTitle, input.source_url, publishedAt)
  };
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "GlobalHantavirusTracker/0.2 (+https://github.com/T4RTET/global-hantavirus-tracker)" },
    next: { revalidate: 900 }
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

function parseRss(xml: string) {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((match) => {
    const item = match[1];
    const pick = (tag: string) => item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1];
    return {
      title: normalizeText(pick("title") ?? "Untitled update"),
      url: normalizeText(pick("link") ?? pick("guid") ?? ""),
      text: normalizeText(`${pick("title") ?? ""} ${pick("description") ?? ""}`),
      published_at: safeDate(pick("pubDate") ?? pick("published") ?? pick("updated"))
    };
  });
}

function uniqueItems(items: NormalizedSourceItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.source_url}|${item.content_hash}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchGdeltArticles(): Promise<NormalizedSourceItem[]> {
  const query = encodeURIComponent(`(${searchQueries.join(" OR ")})`);
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=100&sort=HybridRel`;
  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) throw new Error(`GDELT returned ${response.status}`);
  const payload = (await response.json()) as { articles?: GdeltArticle[] };

  return uniqueItems(
    (payload.articles ?? [])
      .map((article) =>
        normalizeSourceItem({
          source_name: article.domain ? `GDELT / ${article.domain}` : "GDELT",
          source_url: article.url ?? `https://gdeltproject.org/article/${sha256(article.title ?? "untitled")}`,
          source_type: "news",
          raw_title: article.title ?? "Hantavirus news signal",
          raw_text: article.title ?? "",
          published_at: article.seendate ?? null
        })
      )
      .filter(Boolean) as NormalizedSourceItem[]
  );
}

export async function fetchGoogleNewsRss(): Promise<NormalizedSourceItem[]> {
  const items: NormalizedSourceItem[] = [];
  for (const query of searchQueries) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    try {
      const xml = await fetchText(url);
      for (const item of parseRss(xml)) {
        const normalized = normalizeSourceItem({
          source_name: "Google News RSS",
          source_url: item.url,
          source_type: "news",
          raw_title: item.title,
          raw_text: item.text,
          published_at: item.published_at
        });
        if (normalized) items.push(normalized);
      }
    } catch {
      // Source-level errors are summarized in ingestion_runs.
    }
  }
  return uniqueItems(items);
}

export async function fetchWhoDiseaseOutbreakNews(): Promise<NormalizedSourceItem[]> {
  const rssUrls = [
    "https://www.who.int/rss-feeds/news-english.xml",
    "https://www.who.int/feeds/entity/csr/don/en/rss.xml"
  ];
  const items: NormalizedSourceItem[] = [];
  for (const url of rssUrls) {
    try {
      const xml = await fetchText(url);
      for (const item of parseRss(xml)) {
        const normalized = normalizeSourceItem({
          source_name: "WHO Disease Outbreak News",
          source_url: item.url,
          source_type: "official",
          raw_title: item.title,
          raw_text: item.text,
          published_at: item.published_at
        });
        if (normalized) items.push(normalized);
      }
    } catch {
      // Keep ingestion resilient when one official feed changes.
    }
  }
  return uniqueItems(items);
}

export async function fetchCdcFeeds(): Promise<NormalizedSourceItem[]> {
  const items: NormalizedSourceItem[] = [];
  const sources = [
    "https://tools.cdc.gov/api/v2/resources/media/403372.rss",
    "https://www.cdc.gov/hantavirus/"
  ];
  for (const url of sources) {
    try {
      const text = await fetchText(url);
      const parsedItems = url.endsWith(".rss")
        ? parseRss(text)
        : [{ title: "CDC Hantavirus", url, text, published_at: new Date().toISOString() }];
      for (const item of parsedItems) {
        const normalized = normalizeSourceItem({
          source_name: "CDC",
          source_url: item.url || url,
          source_type: "official",
          raw_title: item.title,
          raw_text: item.text,
          published_at: item.published_at
        });
        if (normalized) items.push(normalized);
      }
    } catch {
      // Keep ingestion resilient when CDC pages block or move.
    }
  }
  return uniqueItems(items);
}

export async function fetchEcdcFeeds(): Promise<NormalizedSourceItem[]> {
  const items: NormalizedSourceItem[] = [];
  const sources = [
    "https://www.ecdc.europa.eu/en/rss.xml",
    "https://www.ecdc.europa.eu/en/search?s=hantavirus"
  ];
  for (const url of sources) {
    try {
      const text = await fetchText(url);
      const parsedItems = url.endsWith(".xml")
        ? parseRss(text)
        : [{ title: "ECDC Hantavirus search", url, text, published_at: new Date().toISOString() }];
      for (const item of parsedItems) {
        const normalized = normalizeSourceItem({
          source_name: "ECDC",
          source_url: item.url || url,
          source_type: "official",
          raw_title: item.title,
          raw_text: item.text,
          published_at: item.published_at
        });
        if (normalized) items.push(normalized);
      }
    } catch {
      // Keep ingestion resilient when ECDC feed availability changes.
    }
  }
  return uniqueItems(items);
}

export async function fetchTwitterReports(): Promise<NormalizedSourceItem[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return [];

  const query = [
    "(hantavirus OR \"hanta virus\" OR \"Andes virus\" OR \"virus hanta\" OR \"hantavirus cases\" OR \"hantavirus outbreak\" OR \"hantavirus pulmonary syndrome\")",
    "-is:retweet"
  ].join(" ");
  const params = new URLSearchParams({
    query,
    max_results: "50",
    "tweet.fields": "created_at,lang,author_id",
    expansions: "author_id",
    "user.fields": "username,name,verified"
  });

  const response = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "GlobalHantavirusTracker/0.2 (+https://github.com/T4RTET/global-hantavirus-tracker)"
    },
    next: { revalidate: 900 }
  });
  if (!response.ok) throw new Error(`X recent search returned ${response.status}`);

  const payload = (await response.json()) as XRecentSearchResponse;
  const users = new Map((payload.includes?.users ?? []).map((user) => [user.id, user]));

  return uniqueItems(
    (payload.data ?? [])
      .map((tweet) => {
        const user = tweet.author_id ? users.get(tweet.author_id) : null;
        const username = user?.username;
        const sourceUrl = username ? `https://x.com/${username}/status/${tweet.id}` : `https://x.com/i/web/status/${tweet.id}`;
        const sourceName = username ? `X / @${username}` : "X / Twitter";
        return normalizeSourceItem({
          source_name: sourceName,
          source_url: sourceUrl,
          source_type: "social",
          raw_title: tweet.text.slice(0, 180),
          raw_text: tweet.text,
          published_at: tweet.created_at ?? null
        });
      })
      .filter(Boolean) as NormalizedSourceItem[]
  );
}

async function loadCountries(): Promise<Country[]> {
  const { data, error } = await getSupabaseService().from("countries").select("*");
  if (error) throw error;
  return (data ?? []) as Country[];
}

function findCountry(countries: Country[], text: string) {
  const lower = text.toLowerCase();
  return countries.find((country) => {
    const names = [country.name, country.iso2, country.iso3, country.slug.replace(/-/g, " ")].map((value) => value.toLowerCase());
    return names.some((name) => name.length > 2 && new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(lower));
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstNumberNear(text: string, terms: string[]) {
  const escaped = terms.map(escapeRegExp).join("|");
  const patterns = [
    new RegExp(`(\\d{1,6})\\s+(?:new\\s+)?(?:${escaped})`, "i"),
    new RegExp(`(?:${escaped})\\D{0,32}(\\d{1,6})`, "i")
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number(match[1]);
  }
  return 0;
}

function detectCounts(text: string) {
  const confirmed = firstNumberNear(text, ["confirmed cases", "confirmed case", "cases confirmed", "confirmed", "casos confirmados"]);
  const suspected = firstNumberNear(text, ["suspected cases", "suspected case", "probable cases", "probable", "suspected", "sospechosos"]);
  const deaths = firstNumberNear(text, ["deaths", "death", "fatalities", "fatality", "died", "muertes", "décès"]);
  return { confirmed, suspected, deaths };
}

function detectDate(text: string, fallback: string | null) {
  const patterns = [
    /\b(20\d{2}-\d{2}-\d{2})\b/,
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+20\d{2})\b/i,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+20\d{2})\b/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const parsed = safeDate(match?.[1]);
    if (parsed) return parsed;
  }
  return fallback;
}

function sourceConfidence(item: NormalizedSourceItem, text: string): { confidence: Confidence; reason: string } {
  if (item.source_type === "official") return { confidence: "high", reason: "Official public health source." };
  if (item.source_type === "social") return { confidence: "low", reason: "Social media signal; requires admin review." };
  if (/facebook|twitter|x\.com|telegram|reddit|tiktok/i.test(text)) {
    return { confidence: "low", reason: "Social or weakly sourced signal." };
  }
  if (agencyTerms.some((term) => text.toLowerCase().includes(term))) {
    return { confidence: "medium", reason: "News item appears to cite an official health agency." };
  }
  return { confidence: "medium", reason: "News source matched hantavirus keywords but official citation was not explicit." };
}

function inferStatus(text: string, counts: { confirmed: number; suspected: number; deaths: number }): CandidateStatus {
  const lower = text.toLowerCase();
  if (/prevention|symptoms|factsheet|fact sheet|historical|history|surveillance summary/.test(lower) && counts.confirmed + counts.suspected + counts.deaths === 0) {
    return "official_update";
  }
  if (counts.deaths > 0) return "death";
  if (counts.confirmed > 0 || /\bconfirmed\b|casos confirmados/i.test(text)) return "confirmed";
  if (counts.suspected > 0 || /\bsuspected\b|\bprobable\b|\bsospechos/i.test(text)) return "suspected";
  if (isRelevantText("", text)) return "monitoring";
  return "irrelevant";
}

function shouldAffectTotals(status: CandidateStatus, confidence: Confidence, sourceType: SourceType, counts: { confirmed: number; suspected: number; deaths: number }) {
  if (confidence === "low" || sourceType === "social") return false;
  if (status === "confirmed") return counts.confirmed > 0;
  if (status === "suspected") return counts.suspected > 0;
  if (status === "death") return counts.deaths > 0;
  return false;
}

function makeEventKey(input: {
  countryIso2: string | null;
  countryName: string | null;
  location: string | null;
  date: string | null;
  disease: string;
  confirmed: number;
  suspected: number;
  deaths: number;
}) {
  return sha256(
    [
      input.countryIso2 ?? input.countryName ?? "unknown",
      input.location ?? "",
      input.date?.slice(0, 10) ?? "undated",
      input.disease,
      input.confirmed,
      input.suspected,
      input.deaths
    ].join("|")
  );
}

function extractLocation(text: string, country?: Country) {
  const locationMatch = text.match(/\b(?:in|near|from|at)\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})/);
  const location = locationMatch?.[1]?.trim() ?? null;
  if (!location || location === country?.name) return null;
  return location;
}

async function aiExtract(item: NormalizedSourceItem): Promise<Partial<ExtractedReportData> | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const prompt = `Return strict JSON only:
{
  "is_relevant": true,
  "disease": "hantavirus",
  "country": "",
  "location": "",
  "status": "confirmed | suspected | death | monitoring | official_update | irrelevant",
  "confirmed_count": 0,
  "suspected_count": 0,
  "death_count": 0,
  "date_reported": "",
  "summary": "",
  "confidence": "high | medium | low",
  "confidence_reason": "",
  "should_affect_totals": true
}
Rules:
- If source is WHO/CDC/ECDC/local health agency, confidence = high.
- If reputable news cites official agency directly, confidence = medium.
- If article is vague, confidence = low.
- If article mentions old historical cases, status = official_update or monitoring, should_affect_totals = false.
- If article says suspected, do not increment confirmed_count.
- If article does not clearly state new cases, should_affect_totals = false.
- If article is about prevention/symptoms only, irrelevant or official_update.

Article:
Title: ${item.raw_title}
Source: ${item.source_name}
Type: ${item.source_type}
Published: ${item.published_at ?? "unknown"}
Text: ${item.raw_text.slice(0, 4000)}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You extract cautious public-health event data. Return JSON only." },
          { role: "user", content: prompt }
        ]
      })
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    return content ? (JSON.parse(content) as Partial<ExtractedReportData>) : null;
  } catch {
    return null;
  }
}

export async function extractReportData(item: NormalizedSourceItem, countries: Country[]): Promise<ExtractedReportData> {
  const text = `${item.raw_title}. ${item.raw_text}`;
  const country = findCountry(countries, text);
  const counts = detectCounts(text);
  const status = inferStatus(text, counts);
  const confidence = sourceConfidence(item, text);
  const date = detectDate(text, item.published_at);
  const location = extractLocation(text, country);

  let result: ExtractedReportData = {
    is_relevant: status !== "irrelevant",
    disease: /andes virus/i.test(text) ? "Andes virus" : "hantavirus",
    country: country?.name ?? null,
    country_iso2: country?.iso2 ?? null,
    location,
    lat: country ? Number(country.lat) : null,
    lng: country ? Number(country.lng) : null,
    status,
    confirmed_count: counts.confirmed,
    suspected_count: counts.suspected,
    death_count: counts.deaths,
    date_reported: date,
    summary: item.raw_title.slice(0, 320),
    confidence: confidence.confidence,
    confidence_reason: confidence.reason,
    should_affect_totals: shouldAffectTotals(status, confidence.confidence, item.source_type, counts)
  };

  const needsAiFallback = !result.country || result.status === "monitoring" || result.summary.length < 24;
  const ai = needsAiFallback ? await aiExtract(item) : null;
  if (ai) {
    result = {
      ...result,
      is_relevant: ai.is_relevant ?? result.is_relevant,
      disease: ai.disease || result.disease,
      country: ai.country || result.country,
      location: ai.location || result.location,
      status: (ai.status as CandidateStatus) || result.status,
      confirmed_count: Number(ai.confirmed_count ?? result.confirmed_count) || 0,
      suspected_count: Number(ai.suspected_count ?? result.suspected_count) || 0,
      death_count: Number(ai.death_count ?? result.death_count) || 0,
      date_reported: safeDate(ai.date_reported) ?? result.date_reported,
      summary: ai.summary || result.summary,
      confidence: (ai.confidence as Confidence) || result.confidence,
      confidence_reason: ai.confidence_reason || result.confidence_reason,
      should_affect_totals: ai.should_affect_totals ?? result.should_affect_totals
    };
    const aiCountry = countries.find((candidate) => candidate.name.toLowerCase() === result.country?.toLowerCase());
    if (aiCountry) {
      result.country = aiCountry.name;
      result.country_iso2 = aiCountry.iso2;
      result.lat = Number(aiCountry.lat);
      result.lng = Number(aiCountry.lng);
    }
  }

  if (result.confidence === "low") result.should_affect_totals = false;
  if (!result.country_iso2) result.should_affect_totals = false;
  return result;
}

async function insertNewSourceItems(items: NormalizedSourceItem[]) {
  if (items.length === 0) return [];
  const supabase = getSupabaseService();
  const urls = items.map((item) => item.source_url);
  const hashes = items.map((item) => item.content_hash);
  const [byUrl, byHash] = await Promise.all([
    supabase.from("source_items").select("source_url").in("source_url", urls),
    supabase.from("source_items").select("content_hash").in("content_hash", hashes)
  ]);
  if (byUrl.error) throw byUrl.error;
  if (byHash.error) throw byHash.error;

  const seenUrls = new Set((byUrl.data ?? []).map((row) => row.source_url));
  const seenHashes = new Set((byHash.data ?? []).map((row) => row.content_hash));
  const inserts = items.filter((item) => !seenUrls.has(item.source_url) && !seenHashes.has(item.content_hash));
  if (inserts.length === 0) return [];

  const { data, error } = await supabase
    .from("source_items")
    .insert(inserts.map((item) => ({ ...item, processing_status: "pending" })))
    .select("*");
  if (error) throw error;
  return data ?? [];
}

function reportStatusFromCandidate(status: CandidateStatus): ReportStatus | null {
  if (status === "irrelevant") return null;
  return status;
}

async function createOrUpdateReport(
  candidate: ExtractedReportData,
  item: NormalizedSourceItem,
  candidateId: string,
  eventKey: string,
  options: { keepReview?: boolean } = {}
) {
  const status = reportStatusFromCandidate(candidate.status);
  if (!status || !candidate.country_iso2) return null;
  const supabase = getSupabaseService();
  const { data: country, error: countryError } = await supabase
    .from("countries")
    .select("*")
    .eq("iso2", candidate.country_iso2)
    .single();
  if (countryError || !country) return null;

  const { data: existingByEvent } = await supabase
    .from("reports")
    .select("*")
    .eq("event_key", eventKey)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const reportPayload = {
    country_id: country.id,
    location_name: candidate.location,
    lat: candidate.lat ?? country.lat,
    lng: candidate.lng ?? country.lng,
    status,
    case_count: status === "confirmed" ? candidate.confirmed_count : 0,
    death_count: status === "death" ? candidate.death_count : 0,
    suspected_count: status === "suspected" ? candidate.suspected_count : 0,
    report_date: candidate.date_reported ?? item.published_at ?? new Date().toISOString(),
    source_name: item.source_name,
    source_url: item.source_url,
    source_type: item.source_type,
    confidence: candidate.confidence,
    summary: candidate.summary,
    raw_title: item.raw_title,
    raw_text: item.raw_text,
    event_key: eventKey
  };

  if (existingByEvent) {
    if (confidenceRank[candidate.confidence] > confidenceRank[existingByEvent.confidence as Confidence]) {
      const { data, error } = await supabase
        .from("reports")
        .update(reportPayload)
        .eq("id", existingByEvent.id)
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("extraction_candidates").update({ report_id: data.id, needs_review: options.keepReview ?? false }).eq("id", candidateId);
      return data.id as string;
    }
    await supabase.from("extraction_candidates").update({ report_id: existingByEvent.id, needs_review: options.keepReview ?? false }).eq("id", candidateId);
    return existingByEvent.id as string;
  }

  const { data: existingSimilar } = await supabase
    .from("reports")
    .select("id, confidence")
    .eq("country_id", country.id)
    .eq("report_date", reportPayload.report_date)
    .eq("case_count", reportPayload.case_count)
    .eq("death_count", reportPayload.death_count)
    .eq("suspected_count", reportPayload.suspected_count)
    .limit(1)
    .maybeSingle();

  if (existingSimilar) {
    await supabase.from("extraction_candidates").update({ report_id: existingSimilar.id, needs_review: options.keepReview ?? false }).eq("id", candidateId);
    return existingSimilar.id as string;
  }

  const { data, error } = await supabase.from("reports").insert(reportPayload).select("id").single();
  if (error) throw error;
  await supabase.from("extraction_candidates").update({ report_id: data.id, needs_review: options.keepReview ?? false }).eq("id", candidateId);
  return data.id as string;
}

async function processSourceItem(item: NormalizedSourceItem & { id: string }, countries: Country[]) {
  const supabase = getSupabaseService();
  try {
    const extraction = await extractReportData(item, countries);
    const eventKey = makeEventKey({
      countryIso2: extraction.country_iso2,
      countryName: extraction.country,
      location: extraction.location,
      date: extraction.date_reported ?? item.published_at,
      disease: extraction.disease,
      confirmed: extraction.confirmed_count,
      suspected: extraction.suspected_count,
      deaths: extraction.death_count
    });
    const needsReview = !extraction.is_relevant || extraction.confidence === "low" || !extraction.should_affect_totals || !extraction.country_iso2;

    const { data: candidate, error: candidateError } = await supabase
      .from("extraction_candidates")
      .insert({
        source_item_id: item.id,
        country_name: extraction.country,
        country_iso2: extraction.country_iso2,
        location_name: extraction.location,
        lat: extraction.lat,
        lng: extraction.lng,
        disease: extraction.disease,
        status: extraction.status,
        confirmed_count: extraction.confirmed_count,
        suspected_count: extraction.suspected_count,
        death_count: extraction.death_count,
        date_reported: extraction.date_reported,
        confidence: extraction.confidence,
        confidence_reason: extraction.confidence_reason,
        summary: extraction.summary,
        needs_review: needsReview,
        should_affect_totals: extraction.should_affect_totals,
        event_key: eventKey
      })
      .select("id")
      .single();
    if (candidateError) throw candidateError;

    let reportId: string | null = null;
    if (extraction.is_relevant && extraction.should_affect_totals && extraction.confidence !== "low" && extraction.country_iso2) {
      reportId = await createOrUpdateReport(extraction, item, candidate.id, eventKey);
    } else if (item.source_type === "social" && extraction.is_relevant && extraction.country_iso2) {
      reportId = await createOrUpdateReport(
        {
          ...extraction,
          status: "monitoring",
          confirmed_count: 0,
          suspected_count: 0,
          death_count: 0,
          should_affect_totals: false,
          summary: extraction.summary || item.raw_title
        },
        item,
        candidate.id,
        sha256(`${eventKey}|${item.source_url}`),
        { keepReview: true }
      );
    }

    await supabase
      .from("source_items")
      .update({ processing_status: extraction.is_relevant ? "processed" : "ignored", error: null })
      .eq("id", item.id);

    return { insertedReport: Boolean(reportId), ignored: !extraction.is_relevant };
  } catch (error) {
    await supabase
      .from("source_items")
      .update({ processing_status: "failed", error: error instanceof Error ? error.message : "Unknown processing error" })
      .eq("id", item.id);
    return { insertedReport: false, ignored: false, failed: true };
  }
}

async function fetchAllSources() {
  const results = await Promise.allSettled([
    fetchGdeltArticles(),
    fetchGoogleNewsRss(),
    fetchWhoDiseaseOutbreakNews(),
    fetchCdcFeeds(),
    fetchEcdcFeeds(),
    fetchTwitterReports()
  ]);
  const items = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const errors = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => (result.reason instanceof Error ? result.reason.message : "Unknown fetcher failure"));
  return { items: uniqueItems(items), errors };
}

export async function runIngestion() {
  if (!hasSupabaseEnv()) {
    return { status: "failed", items_found: 0, items_inserted: 0, error: "Supabase env vars are required for ingestion." };
  }

  const supabase = getSupabaseService();
  const startedAt = new Date().toISOString();
  const runInsert = await supabase
    .from("ingestion_runs")
    .insert({ source: "official+gdelt+google-news+x", status: "partial", started_at: startedAt, items_found: 0, items_inserted: 0 })
    .select("id")
    .single();

  const runId = runInsert.data?.id;
  try {
    const countries = await loadCountries();
    const { items, errors } = await fetchAllSources();
    const insertedItems = await insertNewSourceItems(items);
    const processResults = [];
    for (const item of insertedItems) {
      processResults.push(await processSourceItem(item as NormalizedSourceItem & { id: string }, countries));
    }

    await supabase.rpc("recalculate_daily_country_stats");

    const insertedReports = processResults.filter((result) => result.insertedReport).length;
    const failed = processResults.filter((result) => result.failed).length;
    const status = errors.length > 0 || failed > 0 ? "partial" : "success";
    const error = [...errors, failed ? `${failed} source item(s) failed processing` : ""].filter(Boolean).join("; ") || null;
    const result = { status, items_found: items.length, items_inserted: insertedReports, error };

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
