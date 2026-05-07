import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CountryStats } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

export function CountryTable({ countries }: { countries: CountryStats[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Countries</CardTitle>
        <span className="text-xs text-muted-foreground">Source-linked aggregate totals</span>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr className="border-b">
                <th className="pb-3 font-medium">Country</th>
                <th className="pb-3 font-medium">Confirmed</th>
                <th className="pb-3 font-medium">Suspected</th>
                <th className="pb-3 font-medium">Deaths</th>
                <th className="pb-3 font-medium">Last report</th>
                <th className="pb-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {countries.length === 0 ? (
                <tr>
                  <td className="py-8 text-muted-foreground" colSpan={6}>
                    No country reports yet.
                  </td>
                </tr>
              ) : (
                countries.map((country) => (
                  <tr className="border-b border-border/60" key={country.id}>
                    <td className="py-3">
                      <Link className="font-medium hover:text-primary" href={`/country/${country.slug}`}>
                        {country.name}
                      </Link>
                    </td>
                    <td className="py-3 font-mono">{formatNumber(country.confirmed)}</td>
                    <td className="py-3 font-mono">{formatNumber(country.suspected)}</td>
                    <td className="py-3 font-mono">{formatNumber(country.deaths)}</td>
                    <td className="py-3 text-muted-foreground">{formatDate(country.last_report)}</td>
                    <td className="py-3">
                      {country.source_url ? (
                        <a
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                          href={country.source_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          source <ArrowUpRight className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
