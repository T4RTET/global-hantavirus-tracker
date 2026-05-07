"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { CountryStats } from "@/lib/types";

const WorldMap = dynamic(() => import("@/components/Map/WorldMap").then((mod) => mod.WorldMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] rounded-lg md:h-[560px]" />
});

export function WorldMapShell({ countries }: { countries: CountryStats[] }) {
  return <WorldMap countries={countries} />;
}
