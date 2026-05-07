"use client";

import { useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Objects, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import worldCountries from "world-countries";
import { Activity, AlertTriangle, BarChart3, Biohazard, Database, Info, PanelRightOpen, Radar, Search, Skull, Stethoscope, Table2, X } from "lucide-react";
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
  if (!country) return "fill-[#101614] stroke-[#223026]";
  if (country.confirmed > 0) return "fill-red-700 stroke-red-200";
  if (country.suspected > 0 || country.deaths > 0) return "fill-orange-600/80 stroke-orange-100/70";
  return "fill-lime-700/45 stroke-lime-200/40";
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
    <main className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-[#030504]">
      <div className="bio-grid absolute inset-0 opacity-70" />
      <div className="bio-scanlines pointer-events-none absolute inset-0 z-40 opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(127,29,29,0.34),transparent_28rem),radial-gradient(circle_at_76%_18%,rgba(132,204,22,0.08),transparent_26rem),radial-gradient(circle_at_50%_72%,rgba(220,38,38,0.16),transparent_34rem)]" />
      <section className="relative grid min-h-[calc(100vh-65px)] grid-rows-[auto_1fr_auto]">
        <div className="z-10 flex flex-wrap items-center gap-3 px-4 py-4 md:px-6">
          <Badge className="border border-red-300/30 bg-red-950 text-red-100 shadow-[0_0_18px_rgba(239,68,68,0.28)]" variant="danger">
            Threat map
          </Badge>
          <div className="min-w-0">
            <h1 className="bio-text-glow text-2xl font-semibold uppercase tracking-[0.16em] text-red-100 md:text-4xl">Global Hantavirus Tracker</h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-lime-200/70 md:text-sm">
              Surveillance grid online - verified reports only
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-md border border-red-400/20 bg-black/50 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-red-100 sm:inline">
              Last updated {formatDate(globalStats.lastUpdated)}
            </span>
            <ShareButton title="Global Hantavirus Tracker" />
          </div>
        </div>

        <div className="relative z-0 mx-auto flex w-full max-w-[1600px] items-center px-2 md:px-6">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[58vmin] w-[58vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-red-500/10 shadow-[0_0_120px_rgba(127,29,29,0.28)]" />
          <svg
            aria-label="World hantavirus map"
            className="relative h-[62vh] min-h-[420px] w-full drop-shadow-[0_0_28px_rgba(127,29,29,0.32)] md:h-[76vh]"
            role="img"
            viewBox="0 0 1000 560"
          >
            <defs>
              <filter id="countryGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="oceanCore" cx="50%" cy="48%" r="62%">
                <stop offset="0%" stopColor="#0b1611" />
                <stop offset="65%" stopColor="#050908" />
                <stop offset="100%" stopColor="#020303" />
              </radialGradient>
            </defs>
            <rect width="1000" height="560" rx="18" fill="url(#oceanCore)" />
            <path d={path({ type: "Sphere" }) ?? ""} className="fill-transparent stroke-red-950/70" />
            <g opacity="0.14">
              {Array.from({ length: 9 }).map((_, index) => (
                <path d={`M ${70 + index * 110} 38 L ${70 + index * 110} 522`} key={`grid-v-${index}`} stroke="#f87171" strokeWidth="0.6" />
              ))}
              {Array.from({ length: 6 }).map((_, index) => (
                <path d={`M 62 ${72 + index * 78} L 938 ${72 + index * 78}`} key={`grid-h-${index}`} stroke="#f87171" strokeWidth="0.6" />
              ))}
            </g>
            {features.map((geo) => {
              const iso3 = numericToIso3.get(String(geo.id).padStart(3, "0"));
              const country = iso3 ? byIso3.get(iso3) : undefined;
              const isSelected = country?.slug === selectedSlug;
              return (
                <path
                  className={cn(
                    "cursor-pointer transition-colors duration-200 hover:fill-red-300",
                    countryTone(country),
                    isSelected && "stroke-white fill-red-500"
                  )}
                  d={path(geo) ?? ""}
                  filter={country?.confirmed ? "url(#countryGlow)" : undefined}
                  key={`${geo.id}-${geo.properties.name}`}
                  onClick={() => country && openPanel("country", country.slug)}
                  onMouseEnter={() => setHovered(country ?? null)}
                  onMouseLeave={() => setHovered(null)}
                  strokeWidth={isSelected ? 1.6 : 0.5}
                />
              );
            })}
            {countries.filter((country) => country.confirmed > 0).map((country) => {
              const point = projection([country.lng, country.lat]);
              if (!point) return null;
              return (
                <g key={`pulse-${country.id}`}>
                  <circle cx={point[0]} cy={point[1]} r="6" className="fill-red-300" />
                  <circle cx={point[0]} cy={point[1]} r="18" className="animate-pulse fill-none stroke-red-300/80" strokeWidth="2" />
                </g>
              );
            })}
          </svg>

          <div className="bio-hud pointer-events-none absolute bottom-8 left-4 z-10 max-w-sm rounded-sm border border-red-900/80 bg-black/88 p-4 shadow-2xl backdrop-blur md:left-10">
            {activeCountry ? (
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-red-300">Territory scan</p>
                <h2 className="bio-text-glow mt-1 text-xl font-semibold uppercase tracking-[0.08em] text-red-100">{activeCountry.name}</h2>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="font-mono text-lg text-red-300">{formatNumber(activeCountry.confirmed)}</p>
                    <p className="text-xs uppercase text-red-100/50">confirmed</p>
                  </div>
                  <div>
                    <p className="font-mono text-lg text-amber-200">{formatNumber(activeCountry.suspected)}</p>
                    <p className="text-xs uppercase text-red-100/50">suspected</p>
                  </div>
                  <div>
                    <p className="font-mono text-lg text-rose-200">{formatNumber(activeCountry.deaths)}</p>
                    <p className="text-xs uppercase text-red-100/50">deaths</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-red-300">Pathogen overlay</p>
                <div className="mt-3 space-y-2 text-sm">
                  <span className="flex items-center gap-2"><i className="h-3 w-5 rounded-sm bg-red-700 shadow-[0_0_12px_rgba(239,68,68,0.7)]" /> Confirmed zone</span>
                  <span className="flex items-center gap-2"><i className="h-3 w-5 rounded-sm bg-orange-600" /> Suspected signal</span>
                  <span className="flex items-center gap-2"><i className="h-3 w-5 rounded-sm bg-lime-700/70" /> Monitoring watch</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2 px-4 pb-5 md:px-6">
          <HudButton onClick={() => openPanel("stats")} icon={BarChart3}>Stats</HudButton>
          <HudButton onClick={() => openPanel("updates")} icon={Activity}>Updates</HudButton>
          <HudButton onClick={() => openPanel("table")} icon={Table2}>Countries</HudButton>
          <HudButton onClick={() => openPanel("timeline")} icon={Radar}>Timeline</HudButton>
          <HudButton onClick={() => openPanel("sources")} icon={Database}>Intel</HudButton>
          <Button className="ml-auto border-red-400/40 bg-black/70 uppercase tracking-[0.12em] text-red-100 hover:bg-red-950" onClick={() => setPanelOpen(true)} variant="outline">
            <PanelRightOpen className="h-4 w-4" />
            Command panel
          </Button>
        </div>
      </section>

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[60] w-full max-w-xl overflow-y-auto border-l border-red-900/80 bg-black/96 p-4 shadow-2xl shadow-red-950/40 backdrop-blur transition-transform duration-300 md:p-6",
          panelOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-red-300">Last updated {formatDate(globalStats.lastUpdated)}</p>
            <h2 className="bio-text-glow mt-1 text-2xl font-semibold uppercase tracking-[0.1em] text-red-100">
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
            <div className="bio-hud rounded-sm border border-red-900/80 bg-zinc-950 p-5">
              <h3 className="font-semibold uppercase tracking-[0.12em] text-red-100">Intel sources</h3>
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
    <div className="bio-hud rounded-sm border border-red-900/70 bg-zinc-950 p-4">
      <Icon className={cn("h-4 w-4", tone)} />
      <p className={cn("mt-3 font-mono text-2xl font-semibold", tone)}>{formatNumber(value)}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-red-100/50">{label}</p>
    </div>
  );
}

function HudButton({
  icon: Icon,
  children,
  onClick
}: {
  icon: typeof BarChart3;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      className="border border-red-900/70 bg-black/72 font-mono uppercase tracking-[0.14em] text-red-100 shadow-[0_0_18px_rgba(127,29,29,0.18)] hover:bg-red-950/80 hover:text-red-50"
      onClick={onClick}
      variant="secondary"
    >
      <Icon className="h-4 w-4 text-red-300" />
      {children}
    </Button>
  );
}
