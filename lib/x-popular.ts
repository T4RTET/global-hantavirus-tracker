import crypto from "node:crypto";
import { getSupabaseService } from "@/lib/supabase";

type XUser = {
  id: string;
  name?: string;
  username?: string;
};

type XTweet = {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
  public_metrics?: {
    retweet_count?: number;
    reply_count?: number;
    like_count?: number;
    quote_count?: number;
    bookmark_count?: number;
    impression_count?: number;
  };
};

type XRecentSearchResponse = {
  data?: XTweet[];
  includes?: { users?: XUser[] };
};

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function contentHash(title: string, sourceUrl: string, publishedAt: string | null) {
  const day = publishedAt ? publishedAt.slice(0, 10) : "undated";
  return sha256(`${normalizeText(title)}|x.com|${sourceUrl}|${day}`);
}

export async function importPopularXPosts(keyword = "hantavirus", minViews = 100000) {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    throw new Error("X_BEARER_TOKEN is required to import popular X posts.");
  }

  const params = new URLSearchParams({
    query: `${keyword} -is:retweet`,
    max_results: "100",
    "tweet.fields": "created_at,author_id,public_metrics,lang",
    expansions: "author_id",
    "user.fields": "username,name"
  });

  const response = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "GlobalHantavirusTracker/0.2 (+https://github.com/T4RTET/global-hantavirus-tracker)"
    },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`X recent search returned ${response.status}`);

  const payload = (await response.json()) as XRecentSearchResponse;
  const users = new Map((payload.includes?.users ?? []).map((user) => [user.id, user]));
  const posts = (payload.data ?? [])
    .map((tweet) => {
      const user = tweet.author_id ? users.get(tweet.author_id) : null;
      const username = user?.username;
      const views = tweet.public_metrics?.impression_count ?? 0;
      const url = username ? `https://x.com/${username}/status/${tweet.id}` : `https://x.com/i/web/status/${tweet.id}`;
      const title = normalizeText(tweet.text).slice(0, 220);
      return {
        source_name: username ? `X / @${username}` : "X / Twitter",
        source_url: url,
        source_type: "social" as const,
        raw_title: title,
        raw_text: normalizeText(tweet.text),
        published_at: tweet.created_at ?? null,
        content_hash: contentHash(title, url, tweet.created_at ?? null),
        views
      };
    })
    .filter((post) => post.views >= minViews);

  if (posts.length === 0) {
    return { found: 0, inserted: 0 };
  }

  const supabase = getSupabaseService();
  const urls = posts.map((post) => post.source_url);
  const hashes = posts.map((post) => post.content_hash);
  const [byUrl, byHash] = await Promise.all([
    supabase.from("source_items").select("source_url").in("source_url", urls),
    supabase.from("source_items").select("content_hash").in("content_hash", hashes)
  ]);
  if (byUrl.error) throw byUrl.error;
  if (byHash.error) throw byHash.error;

  const seenUrls = new Set((byUrl.data ?? []).map((row) => row.source_url));
  const seenHashes = new Set((byHash.data ?? []).map((row) => row.content_hash));
  const inserts = posts.filter((post) => !seenUrls.has(post.source_url) && !seenHashes.has(post.content_hash));
  if (inserts.length === 0) {
    return { found: posts.length, inserted: 0 };
  }

  const { data: sourceItems, error } = await supabase
    .from("source_items")
    .insert(
      inserts.map(({ views, ...post }) => ({
        ...post,
        raw_title: `[${views.toLocaleString("en-US")} views] ${post.raw_title}`,
        processing_status: "pending"
      }))
    )
    .select("*");
  if (error) throw error;

  const candidateInserts = (sourceItems ?? []).map((item) => ({
    source_item_id: item.id,
    disease: "hantavirus",
    status: "monitoring",
    confirmed_count: 0,
    suspected_count: 0,
    death_count: 0,
    date_reported: item.published_at,
    confidence: "low",
    confidence_reason: "Popular X post imported by admin; requires review before affecting reports.",
    summary: item.raw_title,
    needs_review: true,
    should_affect_totals: false,
    event_key: sha256(`x|${item.source_url}`)
  }));

  const candidateResult = await supabase.from("extraction_candidates").insert(candidateInserts);
  if (candidateResult.error) throw candidateResult.error;

  return { found: posts.length, inserted: candidateInserts.length };
}
