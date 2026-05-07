import type { Metadata } from "next";
import { Disclaimer } from "@/components/Disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How Global Hantavirus Tracker ranks sources, separates report types, and avoids overstating unconfirmed public data."
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-normal">Methodology</h1>
      <p className="mt-3 text-muted-foreground">
        Global Hantavirus Tracker is designed as a source-linked monitoring dashboard, not a medical authority.
      </p>
      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Source priority</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Official public health sources are confidence high. Reputable news sources default to medium. X/Twitter, social, or ambiguous signals default to low and require review.</p>
            <p>Each report must include a source_url. Ingestion deduplicates by source URL and normalized title hash.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Counting rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Confirmed reports update confirmed totals only when the source language indicates confirmed cases.</p>
            <p>Suspected reports stay in suspected_count. Ambiguous articles become monitoring records and do not affect confirmed totals.</p>
            <p>Deaths are tracked separately even when attached to a confirmed report.</p>
          </CardContent>
        </Card>
        <Disclaimer />
      </div>
    </main>
  );
}
