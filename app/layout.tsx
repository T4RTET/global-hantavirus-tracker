import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Activity, Database, Globe2 } from "lucide-react";
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
        <header className="sticky top-0 z-50 border-b bg-background/82 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
            <Link className="flex items-center gap-2 font-semibold" href="/">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <Globe2 className="h-5 w-5" />
              </span>
              <span className="hidden sm:inline">Global Hantavirus Tracker</span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
              {links.map((link) => (
                <Link className="rounded-md px-3 py-2 hover:bg-secondary hover:text-foreground" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {children}
        <footer className="border-t">
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
