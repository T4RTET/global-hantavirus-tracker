import { AlertTriangle, Clock3, Globe2, Skull, Stethoscope, Users } from "lucide-react";
import { CountryTable } from "@/components/CountryTable";
import { Disclaimer } from "@/components/Disclaimer";
import { KpiCard } from "@/components/KpiCard";
import { ReportsFeed } from "@/components/ReportsFeed";
import { ShareButton } from "@/components/ShareButton";
import { TimelineChart } from "@/components/TimelineChart";
import { UpdatesTicker } from "@/components/UpdatesTicker";
import { WorldMapShell } from "@/components/Map/WorldMapShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCountryStats, getDailyStats, getGlobalStats, getReports } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const revalidate = 120;

export default async function HomePage() {
  const [globalStats, countries, reports, timeline] = await Promise.all([
    getGlobalStats(),
    getCountryStats(),
    getReports({ limit: 8 }),
    getDailyStats()
  ]);

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:py-16">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="info">Hantavirus Map 2026</Badge>
            <span className="font-mono text-xs text-muted-foreground">Last updated {formatDate(globalStats.lastUpdated)}</span>
            <ShareButton title="Global Hantavirus Tracker" />
          </div>
          <div className="max-w-4xl">
            <h1 className="text-4xl font-semibold tracking-normal md:text-6xl">Global Hantavirus Tracker</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Live map, reported cases, and verified outbreak updates. Confirmed, suspected, deaths, and monitoring
              records are separated so public signals do not become false certainty.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard helper="Only source-linked confirmed reports" icon={Stethoscope} title="Confirmed cases" value={globalStats.confirmed} />
            <KpiCard helper="Not counted as confirmed" icon={AlertTriangle} title="Suspected cases" value={globalStats.suspected} />
            <KpiCard helper="Reported deaths in source data" icon={Skull} title="Deaths" value={globalStats.deaths} />
            <KpiCard helper="Countries with any active report" icon={Globe2} title="Countries affected" value={globalStats.countriesAffected} />
            <KpiCard helper="UTC timestamp" icon={Clock3} title="Last updated" value={formatDate(globalStats.lastUpdated)} />
          </div>
        </div>
      </section>

      <UpdatesTicker reports={reports} />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>World map</CardTitle>
              <span className="text-xs text-muted-foreground">Pulsing markers indicate latest report geography</span>
            </CardHeader>
            <CardContent>
              <WorldMapShell countries={countries} />
            </CardContent>
          </Card>
          <TimelineChart stats={timeline} title="Reported timeline" />
          <CountryTable countries={countries} />
        </div>
        <aside className="space-y-6">
          <ReportsFeed reports={reports} />
          <Card>
            <CardHeader>
              <CardTitle>Data sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Priority order: official public health authorities, official disease updates, reputable news, then monitoring-only public signals.</p>
              <ul className="space-y-2">
                <li>WHO Disease Outbreak News</li>
                <li>CDC hantavirus pages and historical US data</li>
                <li>ECDC and Africa CDC updates</li>
                <li>GDELT and reputable news search for emerging signals</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h3 className="font-medium text-foreground">Are suspected reports confirmed cases?</h3>
                <p>No. They are shown separately and do not affect confirmed totals.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Why are seed records visible?</h3>
                <p>Local demo mode uses clearly marked seed data until Supabase is configured and real source-linked reports are inserted.</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Can I share this dashboard?</h3>
                <p>Yes. The dynamic OG route renders current totals for X/Twitter and other social cards.</p>
              </div>
            </CardContent>
          </Card>
          <Disclaimer />
        </aside>
      </section>
    </main>
  );
}
