import type { Metadata } from "next";
import Link from "next/link";
import { Check, CopyX, ExternalLink, X } from "lucide-react";
import { approveCandidate, ignoreCandidate, markCandidateDuplicate } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getReviewCandidates } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Review ingestion candidates"
};

const statuses = ["confirmed", "suspected", "death", "monitoring", "official_update", "irrelevant"];
const confidences = ["high", "medium", "low"];

export default async function ReviewPage({ searchParams }: { searchParams: { password?: string } }) {
  const password = searchParams.password ?? "";
  const isUnlocked = Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
  const candidates = isUnlocked ? await getReviewCandidates(100) : [];

  if (!isUnlocked) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Review access</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <Input name="password" placeholder="ADMIN_PASSWORD" type="password" />
              <Button className="w-full" type="submit">Unlock review queue</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Ingestion review</h1>
          <p className="mt-2 text-muted-foreground">
            Low-confidence, ambiguous, unmatched, or non-total candidates stay here until reviewed.
          </p>
        </div>
        <Link className="text-sm text-primary hover:underline" href={`/admin?password=${encodeURIComponent(password)}`}>
          Back to admin
        </Link>
      </div>

      {!hasSupabaseEnv() ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Supabase env vars are required for review mode.</CardContent>
        </Card>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No candidates need review.</CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {candidates.map((candidate) => (
            <Card key={candidate.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{candidate.source_item?.raw_title ?? "Untitled candidate"}</CardTitle>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {candidate.source_item?.source_name} · {formatDate(candidate.date_reported ?? candidate.source_item?.published_at)}
                    </p>
                  </div>
                  {candidate.source_item?.source_url ? (
                    <a
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      href={candidate.source_item.source_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Source <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border bg-background/40 p-4 text-sm leading-6 text-muted-foreground">
                  {candidate.summary || candidate.source_item?.raw_text?.slice(0, 700)}
                </div>
                <form action={approveCandidate} className="grid gap-4">
                  <input name="password" type="hidden" value={password} />
                  <input name="id" type="hidden" value={candidate.id} />
                  <input name="event_key" type="hidden" value={candidate.event_key ?? ""} />
                  <div className="grid gap-3 md:grid-cols-4">
                    <Input defaultValue={candidate.country_name ?? ""} name="country_name" placeholder="Country" />
                    <Input defaultValue={candidate.country_iso2 ?? ""} name="country_iso2" placeholder="ISO2" />
                    <Input defaultValue={candidate.location_name ?? ""} name="location_name" placeholder="Location" />
                    <Input defaultValue={candidate.date_reported?.slice(0, 16) ?? ""} name="date_reported" type="datetime-local" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-5">
                    <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={candidate.status} name="status">
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <select className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue={candidate.confidence} name="confidence">
                      {confidences.map((confidence) => <option key={confidence}>{confidence}</option>)}
                    </select>
                    <Input defaultValue={candidate.confirmed_count} min="0" name="confirmed_count" placeholder="Confirmed" type="number" />
                    <Input defaultValue={candidate.suspected_count} min="0" name="suspected_count" placeholder="Suspected" type="number" />
                    <Input defaultValue={candidate.death_count} min="0" name="death_count" placeholder="Deaths" type="number" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input defaultValue={candidate.lat ?? ""} name="lat" placeholder="Latitude" type="number" step="0.0001" />
                    <Input defaultValue={candidate.lng ?? ""} name="lng" placeholder="Longitude" type="number" step="0.0001" />
                  </div>
                  <Textarea defaultValue={candidate.summary} name="summary" placeholder="Summary" />
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit">
                      <Check className="h-4 w-4" />
                      Approve and add
                    </Button>
                  </div>
                </form>
                <div className="flex flex-wrap gap-2">
                  <form action={ignoreCandidate}>
                    <input name="password" type="hidden" value={password} />
                    <input name="id" type="hidden" value={candidate.id} />
                    <Button type="submit" variant="secondary">
                      <X className="h-4 w-4" />
                      Ignore
                    </Button>
                  </form>
                  <form action={markCandidateDuplicate}>
                    <input name="password" type="hidden" value={password} />
                    <input name="id" type="hidden" value={candidate.id} />
                    <Button type="submit" variant="outline">
                      <CopyX className="h-4 w-4" />
                      Mark duplicate
                    </Button>
                  </form>
                </div>
                <p className="text-xs text-muted-foreground">{candidate.confidence_reason}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
