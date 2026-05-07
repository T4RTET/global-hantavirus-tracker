import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Trash2 } from "lucide-react";
import { addReport, deleteReport, importXPosts, recalculateStats, updateReportConfidence } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCountries, getReports } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin"
};

const statuses = ["confirmed", "suspected", "death", "monitoring", "recovered", "official_update"];
const confidences = ["high", "medium", "low"];
const sourceTypes = ["official", "news", "social", "manual"];

export default async function AdminPage({ searchParams }: { searchParams: { password?: string } }) {
  const password = searchParams.password ?? "";
  const isUnlocked = Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
  const [countries, reports] = await Promise.all([getCountries(), getReports({ limit: 25 })]);

  if (!isUnlocked) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Admin access</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <Input name="password" placeholder="ADMIN_PASSWORD" type="password" />
              <Button className="w-full" type="submit">Unlock</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-normal">Admin</h1>
        <p className="mt-2 text-muted-foreground">
          Manual reports require source URLs. Admin mutations are {hasSupabaseEnv() ? "connected to Supabase" : "disabled until Supabase env vars are set"}.
        </p>
        <Link className="mt-3 inline-flex text-sm text-primary hover:underline" href={`/admin/review?password=${encodeURIComponent(password)}`}>
          Review ingestion candidates
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Add manual report</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={importXPosts} className="mb-5 rounded-md border border-red-900/60 bg-black/40 p-4">
              <input name="password" type="hidden" value={password} />
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageCircle className="h-4 w-4 text-red-300" />
                Import popular X posts
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Searches X for `hantavirus`, keeps posts with 100k+ views, and sends them to review as low-confidence monitoring signals.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                <Input name="keyword" defaultValue="hantavirus" />
                <Input name="min_views" defaultValue="100000" min="1" type="number" />
                <Button disabled={!hasSupabaseEnv()} type="submit" variant="secondary">Parse X</Button>
              </div>
            </form>
            <form action={addReport} className="grid gap-4">
              <input name="password" type="hidden" value={password} />
              <label className="grid gap-2 text-sm">
                Country
                <select className="h-10 rounded-md border bg-background px-3" name="country_id" required>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>{country.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input name="location_name" placeholder="Location name" />
                <Input name="report_date" required type="datetime-local" />
                <Input name="lat" placeholder="Latitude" type="number" step="0.0001" />
                <Input name="lng" placeholder="Longitude" type="number" step="0.0001" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input name="case_count" placeholder="Confirmed" type="number" min="0" defaultValue="0" />
                <Input name="suspected_count" placeholder="Suspected" type="number" min="0" defaultValue="0" />
                <Input name="death_count" placeholder="Deaths" type="number" min="0" defaultValue="0" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <select className="h-10 rounded-md border bg-background px-3 text-sm" name="status">
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
                <select className="h-10 rounded-md border bg-background px-3 text-sm" name="source_type">
                  {sourceTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
                <select className="h-10 rounded-md border bg-background px-3 text-sm" name="confidence">
                  {confidences.map((confidence) => <option key={confidence}>{confidence}</option>)}
                </select>
              </div>
              <Input name="source_name" placeholder="Source name" required />
              <Input name="source_url" placeholder="https://..." required type="url" />
              <Input name="raw_title" placeholder="Raw title" />
              <Textarea name="summary" placeholder="Short source-grounded summary" required />
              <Textarea name="raw_text" placeholder="Optional raw text excerpt" />
              <Button disabled={!hasSupabaseEnv()} type="submit">Add report</Button>
            </form>
            <form action={recalculateStats} className="mt-4">
              <input name="password" type="hidden" value={password} />
              <Button disabled={!hasSupabaseEnv()} type="submit" variant="secondary">Recalculate stats</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Edit reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.map((report) => (
              <div className="rounded-lg border p-4" key={report.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{report.country?.name} {report.status}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(report.report_date)} - {report.source_name}</p>
                  </div>
                  <form action={deleteReport}>
                    <input name="password" type="hidden" value={password} />
                    <input name="id" type="hidden" value={report.id} />
                    <Button disabled={!hasSupabaseEnv()} size="icon" type="submit" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>
                <form action={updateReportConfidence} className="mt-3 flex gap-2">
                  <input name="password" type="hidden" value={password} />
                  <input name="id" type="hidden" value={report.id} />
                  <select className="h-9 rounded-md border bg-background px-3 text-sm" defaultValue={report.confidence} name="confidence">
                    {confidences.map((confidence) => <option key={confidence}>{confidence}</option>)}
                  </select>
                  <Button disabled={!hasSupabaseEnv()} size="sm" type="submit" variant="outline">Save confidence</Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
