import { FullscreenWorldDashboard } from "@/components/Map/FullscreenWorldDashboard";
import { getCountryStats, getDailyStats, getGlobalStats, getReports } from "@/lib/data";

export const revalidate = 120;

export default async function HomePage() {
  const [globalStats, countries, reports, timeline] = await Promise.all([
    getGlobalStats(),
    getCountryStats(),
    getReports({ limit: 8 }),
    getDailyStats()
  ]);

  return <FullscreenWorldDashboard countries={countries} globalStats={globalStats} reports={reports} timeline={timeline} />;
}
