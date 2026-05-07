"use client";

import { useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Objects, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import worldCountries from "world-countries";
import { Activity, AlertTriangle, BarChart3, Database, Info, PanelRightOpen, Search, Skull, Stethoscope, Table2, X } from "lucide-react";
import { CountryTable } from "@/components/CountryTable";
import { Disclaimer } from "@/components/Disclaimer";
import { ReportsFeed } from "@/components/ReportsFeed";
import { ShareButton } from "@/components/ShareButton";
import { TimelineChart } from "@/components/TimelineChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CountryStats, DailyCountryStat, GlobalStats, Report } from "@/lib/types";
import { cn, formatDate, formatNumber } from "@/lib/utils";

type PanelMode = "country" | "stats" | "updates" | "table" | "timeline" | "sources";

type GeometryFeature = {
  type: "Feature";
  id: string | number;
  properties: { name?: string };
  geometry: GeoJSON.Geometry;
};

type WorldTopology = Topology<Objects<GeoJSON.GeoJsonProperties>>;

const numericToIso3 = new Map(
  worldCountries
    .filter((country) => country.ccn3 && country.cca3)
    .map((country) => [country.ccn3, country.cca3])
);

const projection = geoNaturalEarth1().fitSize([1000, 560], { type: "Sphere" });
const path = geoPath(projection);

function getFeatures() {
  const topology = world as unknown as WorldTopology;
  return (feature(topology, topology.objects.countries) as unknown as GeoJSON.FeatureCollection).features as GeometryFeature[];
}

function countryTone(country?: CountryStats) {
  if (!country) return "fill-slate-900/70 stroke-slate-700/50";
  if (country.confirmed > 0) return "fill-red-600/85 stroke-red-200/70";
  if (country.suspected > 0 || country.deaths > 0) return "fill-amber-500/70 stroke-amber-100/60";
  return "fill-teal-500/35 stroke-teal-100/40";
}

function latestCountryReport(country: CountryStats | null, reports: Report[]) {
  if (!country) return [];
  return reports.filter((report) => report.country?.slug === country.slug).slice(0, 5);
}

export function FullscreenWorldDashboard({
  globalStats,
  countries,
  reports,
  timeline
}: {
  globalStats: GlobalStats;
  countries: CountryStats[];
  reports: Report[];
  timeline: DailyCountryStat[];
}) {
  const [mode, setMode] = useState<PanelMode>("stats");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(countries.find((country) => country.confirmed > 0)?.slug ?? null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hovered, setHovered] = useState<CountryStats | null>(null);

  const byIso3 = useMemo(() => new Map(countries.map((country) => [country.iso3, country])), [countries]);
  const features = useMemo(getFeatures, []);
  const selectedCountry = countries.find((country) => country.slug === selectedSlug) ?? null;
  const activeCountry = hovered ?? selectedCountry;
  const countryReports = latestCountryReport(selectedCountry, reports);

  function openPanel(nextMode: PanelMode, slug?: string) {
    setMode(nextMode);
    if (slug) setSelectedSlug(slug);
    setPanelOpen(true);
  }

  return (
    <main className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-[#050910]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(20,184,166,0.22),transparent_30rem),radial-gradient(circle_at_76%_20%,rgba(239,68,68,0.14),transparent_26rem)]" />
      <section className="relative grid min-h-[calc(100vh-65px)] grid-rows-[auto_1fr_auto]">
        <div className="z-10 flex flex-wrap items-center gap-3 px-4 py-4 md:px-6">
          <Badge variant="danger">Live map</Badge>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal md:text-4xl">Global Hantavirus Tracker</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Live map, reported cases, and verified outbreak updates
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
              Last updated {formatDate(globalStats.lastUpdated)}
            </span>
            <ShareButton title="Global Hantavirus Tracker" />
          </div>
        </div>

        <div className="relative z-0 mx-auto flex w-full max-w-[1600px] items-center px-2 md:px-6">
          <svg
            aria-label="World hantavirus map"
            className="h-[62vh] min-h-[420px] w-full md:h-[76vh]"
            role="img"
            viewBox="0 0 1000 560"
          >
            <defs>
              <filter id="countryGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="1000" height="560" rx="24" className="fill-[#071014]" />
            <path d={path({ type: "Sphere" }) ?? ""} className="fill-[#071014] stroke-slate-800" />
            {features.map((geo) => {
              const iso3 = numericToIso3.get(String(geo.id).padStart(3, "0"));
              const country = iso3 ? byIso3.get(iso3) : undefined;
              const isSelected = country?.slug === selectedSlug;
              return (
                <path
                  className={cn(
                    "cursor-pointer transition-colors duration-200 hover:fill-cyan-300/70",
                    countryTone(country),
                    isSelected && "stroke-white"
                  )}
                  d={path(geo) ?? ""}
                  filter={country?.confirmed ? "url(#countryGlow)" : undefined}
                  key={`${geo.id}-${geo.properties.name}`}
                  onClick={() => country && openPanel("country", country.slug)}
                  onMouseEnter={() => setHovered(country ?? null)}
                  onMouseLeave={() => setHovered(null)}
                  strokeWidth={isSelected ? 1.3 : 0.45}
                />
              );
            })}
          </svg>

          <div className="pointer-events-none absolute bottom-8 left-4 z-10 max-w-sm rounded-lg border bg-background/88 p-4 shadow-2xl backdrop-blur md:left-10">
            {activeCountry ? (
              <div>
                <p className="text-xs uppercase text-muted-foreground">Selected country</p>
                <h2 className="mt-1 text-xl font-semibold">{activeCountry.name}</h2>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="font-mono text-lg text-red-300">{formatNumber(activeCountry.confirmed)}</p>
                    <p className="text-xs text-muted-foreground">confirmed</p>
                  </div>
                  <div>
                    <p className="font-mono text-lg text-amber-200">{formatNumber(activeCountry.suspected)}</p>
                    <p className="text-xs text-muted-foreground">suspected</p>
                  </div>
                  <div>
                    <p className="font-mono text-lg text-rose-200">{formatNumber(activeCountry.deaths)}</p>
                    <p className="text-xs text-muted-foreground">deaths</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs uppercase text-muted-foreground">Map legend</p>
                <div className="mt-3 space-y-2 text-sm">
                  <span className="flex items-center gap-2"><i className="h-3 w-5 rounded-sm bg-red-600" /> Confirmed cases</span>
                  <span className="flex items-center gap-2"><i className="h-3 w-5 rounded-sm bg-amber-500" /> Suspected or deaths</span>
                  <span className="flex items-center gap-2"><i className="h-3 w-5 rounded-sm bg-teal-500/60" /> Monitoring reports</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2 px-4 pb-5 md:px-6">
          <Button onClick={() => openPanel("stats")} variant="secondary"><BarChart3 className="h-4 w-4" /> Stats</Button>
          <Button onClick={() => openPanel("updates")} variant="secondary"><Activity className="h-4 w-4" /> Updates</Button>
          <Button onClick={() => openPanel("table")} variant="secondary"><Table2 className="h-4 w-4" /> Countries</Button>
          <Button onClick={() => openPanel("timeline")} variant="secondary"><Search className="h-4 w-4" /> Timeline</Button>
          <Button onClick={() => openPanel("sources")} variant="secondary"><Database className="h-4 w-4" /> Sources</Button>
          <Button className="ml-auto" onClick={() => setPanelOpen(true)} variant="outline">
            <PanelRightOpen className="h-4 w-4" />
            Open panel
          </Button>
        </div>
      </section>

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[60] w-full max-w-xl overflow-y-auto border-l bg-background/96 p-4 shadow-2xl backdrop-blur transition-transform duration-300 md:p-6",
          panelOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-muted-foreground">Last updated {formatDate(globalStats.lastUpdated)}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">
              {mode === "country" && selectedCountry ? selectedCountry.name : "Tracker details"}
            </h2>
          </div>
          <Button onClick={() => setPanelOpen(false)} size="icon" variant="ghost" aria-label="Close panel">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {mode === "country" && selectedCountry ? (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <Metric icon={Stethoscope} label="Confirmed" value={selectedCountry.confirmed} tone="text-red-300" />
              <Metric icon={AlertTriangle} label="Suspected" value={selectedCountry.suspected} tone="text-amber-200" />
              <Metric icon={Skull} label="Deaths" value={selectedCountry.deaths} tone="text-rose-200" />
            </div>
            <ReportsFeed reports={countryReports.length ? countryReports : reports.slice(0, 3)} title="Latest country reports" />
          </div>
        ) : null}

        {mode === "stats" ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Metric icon={Stethoscope} label="Confirmed cases" value={globalStats.confirmed} tone="text-red-300" />
              <Metric icon={AlertTriangle} label="Suspected cases" value={globalStats.suspected} tone="text-amber-200" />
              <Metric icon={Skull} label="Deaths" value={globalStats.deaths} tone="text-rose-200" />
              <Metric icon={Info} label="Countries affected" value={globalStats.countriesAffected} tone="text-cyan-200" />
            </div>
            <Disclaimer />
          </div>
        ) : null}

        {mode === "updates" ? <ReportsFeed reports={reports} title="Recent updates" /> : null}
        {mode === "table" ? <CountryTable countries={countries} /> : null}
        {mode === "timeline" ? <TimelineChart stats={timeline} title="Reported timeline" /> : null}
        {mode === "sources" ? (
          <div className="space-y-5">
            <div className="rounded-lg border bg-card p-5">
              <h3 className="font-semibold">Data sources</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>WHO Disease Outbreak News</li>
                <li>CDC hantavirus pages and feeds</li>
                <li>ECDC updates</li>
                <li>GDELT DOC 2.0 and Google News RSS</li>
                <li>Manual admin review for low-confidence candidates</li>
              </ul>
            </div>
            <Disclaimer />
          </div>
        ) : null}
      </aside>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof Stethoscope;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <Icon className={cn("h-4 w-4", tone)} />
      <p className={cn("mt-3 font-mono text-2xl font-semibold", tone)}>{formatNumber(value)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
