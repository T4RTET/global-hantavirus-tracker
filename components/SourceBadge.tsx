import { Badge } from "@/components/ui/badge";
import type { Confidence, SourceType } from "@/lib/types";

export function SourceBadge({ sourceType, confidence }: { sourceType: SourceType; confidence: Confidence }) {
  const variant = confidence === "high" ? "success" : confidence === "medium" ? "info" : "warning";
  return (
    <span className="inline-flex items-center gap-2">
      <Badge variant={sourceType === "official" ? "success" : sourceType === "news" ? "info" : "secondary"}>
        {sourceType}
      </Badge>
      <Badge variant={variant}>{confidence}</Badge>
    </span>
  );
}
