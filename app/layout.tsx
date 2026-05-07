import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Activity, Database, Radiation } from "lucide-react";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Global Hantavirus Tracker — Live Map & Reported Cases",
    template: "%s | Global Hantavirus Tracker"
  },
  description:
    "A neutral, source-linked dashboard tracking publicly reported hantavirus cases, suspected reports, deaths, and official updates.",
  openGraph: {
    title: "Global Hantavirus Tracker — Live Map & Reported Cases",
    description: "Live map, reported cases, and verified outbreak updates.",
    type: "website",
    images: ["/api/og"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Hantavirus Map 2026 — Live Outbreak Tracker",
    description: "Source-linked hantavirus dashboard with confirmed, suspected, death, and monitoring reports.",
    images: ["/api/og"]
  }
};

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/latest", label: "Latest" },
  { href: "/about", label: "Methodology" },
  { href: "/admin", label: "Admin" }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`dark ${sans.variable} ${mono.variable}`} lang="en">
      <body className="font-sans antialiased">
        <header className="sticky top-0 z-50 border-b border-red-950/70 bg-black/88 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
            <Link className="flex items-center gap-2 font-semibold uppercase tracking-[0.16em]" href="/">
              <span className="grid h-9 w-9 place-items-center rounded-md border border-red-400/40 bg-red-950/70 text-red-100 shadow-[0_0_24px_rgba(239,68,68,0.25)]">
                <Radiation className="h-5 w-5" />
              </span>
              <span className="hidden sm:inline text-red-100">Global Hantavirus Tracker</span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
              {links.map((link) => (
                <Link className="rounded-md px-3 py-2 uppercase tracking-[0.12em] hover:bg-red-950/70 hover:text-red-100" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t border-red-950/60 bg-black">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-muted-foreground md:grid-cols-3">
            <div className="flex items-center gap-2 text-foreground">
              <Activity className="h-4 w-4 text-primary" />
              Data-first public health dashboard
            </div>
            <p>This tracker aggregates publicly reported data and is not a medical authority.</p>
            <p className="flex items-center gap-2 md:justify-end">
              <Database className="h-4 w-4" />
              Source URL required for every report.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
