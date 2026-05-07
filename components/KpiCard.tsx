import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

export function KpiCard({
  title,
  value,
  icon: Icon,
  helper
}: {
  title: string;
  value: number | string;
  icon: LucideIcon;
  helper?: string;
}) {
  return (
    <Card className="overflow-hidden bg-card/80">
      <CardHeader className="flex-row items-center justify-between gap-4 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-normal md:text-3xl">
          {typeof value === "number" ? formatNumber(value) : value}
        </div>
        {helper ? <p className="mt-2 text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
