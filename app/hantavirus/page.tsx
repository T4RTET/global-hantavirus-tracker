import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Microscope, ShieldCheck, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Hantavirus - symptoms, transmission, prevention",
  description:
    "A neutral overview of hantavirus, how it is transmitted, symptoms to watch for, prevention steps, and why tracker data separates confirmed and suspected reports.",
  alternates: { canonical: "/hantavirus" },
  openGraph: {
    title: "Hantavirus - symptoms, transmission, prevention",
    description: "What hantavirus is, how it spreads, symptoms, prevention, and source-linked tracker context.",
    type: "article"
  }
};

const sections = [
  {
    icon: Microscope,
    title: "What is hantavirus?",
    body:
      "Hantaviruses are a family of viruses carried mainly by rodents. In people, different hantaviruses can cause severe disease, including hantavirus pulmonary syndrome and hemorrhagic fever with renal syndrome."
  },
  {
    icon: AlertTriangle,
    title: "How it spreads",
    body:
      "Most infections happen after exposure to urine, droppings, saliva, or nesting material from infected rodents, especially in enclosed or poorly ventilated spaces. Rodent bites are a rarer route. Human-to-human transmission is uncommon and has been documented mainly for Andes virus."
  },
  {
    icon: Stethoscope,
    title: "Symptoms",
    body:
      "Symptoms can begin days to weeks after exposure and may include fever, fatigue, muscle aches, headache, nausea, vomiting, abdominal pain, cough, and shortness of breath. Severe cases can affect the lungs, kidneys, heart, and circulation."
  },
  {
    icon: ShieldCheck,
    title: "Prevention",
    body:
      "Reduce contact with rodents, seal entry points, store food securely, avoid dry sweeping rodent droppings, ventilate enclosed spaces before cleanup, and use wet cleaning methods and protective equipment when contamination is possible."
  }
];

export default function HantavirusPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Hantavirus overview",
    about: {
      "@type": "MedicalCondition",
      name: "Hantavirus infection"
    },
    publisher: {
      "@type": "Organization",
      name: "Global Hantavirus Tracker"
    }
  };

  return (
    <main className="min-h-screen bg-[#030504]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-red-950/70 bg-[radial-gradient(circle_at_30%_10%,rgba(127,29,29,0.32),transparent_28rem)]">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-red-300">Virus brief</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-red-50 md:text-6xl">Hantavirus</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-red-100/72">
            A source-linked, non-alarmist overview of what hantavirus is, how exposure usually happens, and why confirmed,
            suspected, death, and monitoring reports are tracked separately.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-10 md:grid-cols-2">
        {sections.map(({ icon: Icon, title, body }) => (
          <Card className="border-red-950/70 bg-black/70" key={title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-50">
                <Icon className="h-5 w-5 text-red-300" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-red-100/66">{body}</CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <Card className="border-red-950/70 bg-black/70">
          <CardHeader>
            <CardTitle className="text-red-50">How to read tracker data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-red-100/66">
            <p>
              This site separates confirmed cases, suspected reports, deaths, and monitoring updates. A country can be highlighted
              on the map when it has a report in the tracker, but source links and confidence labels should be read before treating
              a report as confirmed.
            </p>
            <p>
              Social or media signals can be useful for early awareness, but they are not medical confirmation. Official public
              health sources remain the highest-priority source category.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link className="rounded-md border border-red-900/70 px-4 py-2 text-red-100 hover:bg-red-950/60" href="https://www.cdc.gov/hantavirus/">
                CDC hantavirus overview
              </Link>
              <Link className="rounded-md border border-red-900/70 px-4 py-2 text-red-100 hover:bg-red-950/60" href="https://www.cdc.gov/hantavirus/prevention/index.html">
                CDC prevention
              </Link>
              <Link className="rounded-md border border-red-900/70 px-4 py-2 text-red-100 hover:bg-red-950/60" href="https://www.who.int/news-room/fact-sheets/detail/hantavirus">
                WHO fact sheet
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
