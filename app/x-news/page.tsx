import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseService, hasSupabaseEnv } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "X News - popular hantavirus posts",
  description: "Popular X/Twitter posts imported by keyword for hantavirus monitoring and admin review."
};

type XSourceItem = {
  id: string;
  source_name: string;
  source_url: string;
  raw_title: string;
  raw_text: string;
  published_at: string | null;
  fetched_at: string;
  processing_status: "pending" | "processed" | "ignored" | "failed";
};

async function getXItems(): Promise<XSourceItem[]> {
  if (!hasSupabaseEnv()) return [];
  const { data, error } = await getSupabaseService()
    .from("source_items")
    .select("id, source_name, source_url, raw_title, raw_text, published_at, fetched_at, processing_status")
    .eq("source_type", "social")
    .ilike("source_name", "X /%")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as XSourceItem[];
}

export default async function XNewsPage() {
  const items = await getXItems();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-red-300">Social signal review</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">X News</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Popular X/Twitter posts imported by keyword. These are social signals only: they do not update confirmed totals unless an admin reviews and approves a report.
          </p>
        </div>
        <Link className="rounded-md border border-red-900/70 px-4 py-2 text-sm text-red-100 hover:bg-red-950/60" href="/admin">
          Parse in admin
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-red-300" />
            Imported popular posts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm leading-6 text-muted-foreground">
              No imported X posts yet. Add `X_BEARER_TOKEN` in Vercel/env, open `/admin`, and use the `Parse X` button with keyword `hantavirus` and minimum views `100000`.
            </div>
          ) : (
            items.map((item) => (
              <article className="rounded-lg border bg-background/40 p-4" key={item.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">social</Badge>
                  <Badge variant={item.processing_status === "pending" ? "warning" : "info"}>{item.processing_status}</Badge>
                  <time className="ml-auto text-xs text-muted-foreground">{formatDate(item.published_at ?? item.fetched_at)}</time>
                </div>
                <h2 className="mt-3 font-medium">{item.raw_title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.raw_text}</p>
                <a className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline" href={item.source_url} rel="noreferrer" target="_blank">
                  {item.source_name} <ExternalLink className="h-3 w-3" />
                </a>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
