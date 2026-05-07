import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CountryTable } from "@/components/CountryTable";
import { Disclaimer } from "@/components/Disclaimer";
import { KpiCard } from "@/components/KpiCard";
import { ReportsFeed } from "@/components/ReportsFeed";
import { ShareButton } from "@/components/ShareButton";
import { TimelineChart } from "@/components/TimelineChart";
import { WorldMapShell } from "@/components/Map/WorldMapShell";
import { AlertTriangle, Clock3, Skull, Stethoscope } from "lucide-react";
import { getCountryBySlug, getDailyStats, getReports } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const country = await getCountryBySlug(params.slug);
  if (!country) return {};
  return {
    title: `Hantavirus cases in ${country.name} — live tracker`,
    description: `Source-linked hantavirus reports for ${country.name}, including confirmed, suspected, deaths, and latest public updates.`,
    openGraph: {
      title: `Hantavirus cases in ${country.name} — live tracker`,
      description: `Live country stats and latest source-linked reports for ${country.name}.`,
      images: [`/api/og?country=${country.slug}`]
    }
  };
}

export default async function CountryPage({ params }: { params: { slug: string } }) {
  const country = await getCountryBySlug(params.slug);
  if (!country) notFound();
  const [reports, timeline] = await Promise.all([
    getReports({ country: params.slug, limit: 40 }),
    getDailyStats(params.slug)
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground">Last report {formatDate(country.last_report)}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-5xl">Hantavirus cases in {country.name}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Country-specific source-linked reports with confirmed, suspected, deaths, and monitoring records separated.
          </p>
        </div>
        <ShareButton title={`Hantavirus cases in ${country.name}`} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard icon={Stethoscope} title="Confirmed" value={country.confirmed} />
        <KpiCard icon={AlertTriangle} title="Suspected" value={country.suspected} />
        <KpiCard icon={Skull} title="Deaths" value={country.deaths} />
        <KpiCard icon={Clock3} title="Last report" value={formatDate(country.last_report)} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <div className="space-y-6">
          <WorldMapShell countries={[country]} />
          <TimelineChart stats={timeline} title={`${country.name} timeline`} />
          <CountryTable countries={[country]} />
        </div>
        <div className="space-y-6">
          <ReportsFeed reports={reports} title="Latest country reports" />
          <Disclaimer />
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: `Hantavirus reports in ${country.name}`,
            description: `Publicly reported hantavirus data for ${country.name}.`,
            url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/country/${country.slug}`,
            temporalCoverage: timeline[0]?.date ? `${timeline[0].date}/..` : undefined
          })
        }}
        type="application/ld+json"
      />
    </main>
  );
}
