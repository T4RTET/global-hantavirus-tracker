import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getCountryBySlug, getGlobalStats } from "@/lib/data";

export const runtime = "edge";

const imageSize = { width: 1200, height: 630 };

export async function GET(request: NextRequest) {
  const countrySlug = request.nextUrl.searchParams.get("country");
  const [globalStats, country] = await Promise.all([
    getGlobalStats(),
    countrySlug ? getCountryBySlug(countrySlug) : Promise.resolve(null)
  ]);
  const title = country ? `Hantavirus cases in ${country.name}` : "Global Hantavirus Tracker";
  const confirmed = country?.confirmed ?? globalStats.confirmed;
  const suspected = country?.suspected ?? globalStats.suspected;
  const deaths = country?.deaths ?? globalStats.deaths;
  const countries = country ? 1 : globalStats.countriesAffected;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#050910",
          color: "#ecfeff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: 56,
          width: "100%"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 28, color: "#5eead4" }}>Live source-linked dashboard</div>
          <div style={{ fontSize: 20, color: "#94a3b8" }}>
            {`Updated ${new Date(globalStats.lastUpdated ?? Date.now()).toUTCString()}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
          <div style={{ width: 460, height: 260, borderRadius: 24, border: "1px solid #164e63", background: "#071014", position: "relative", display: "flex" }}>
            {[["18%", "38%"], ["29%", "61%"], ["47%", "45%"], ["61%", "62%"], ["75%", "42%"]].map(([left, top]) => (
              <div
                key={`${left}-${top}`}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: "#2dd4bf",
                  border: "3px solid #ccfbf1"
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.04 }}>{title}</div>
            <div style={{ color: "#94a3b8", fontSize: 26 }}>Confirmed, suspected, deaths, and monitoring reports separated.</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          {[
            ["Confirmed", confirmed],
            ["Suspected", suspected],
            ["Deaths", deaths],
            ["Countries", countries]
          ].map(([label, value]) => (
            <div key={label} style={{ flex: 1, border: "1px solid #1f2937", borderRadius: 16, padding: 24, background: "#0b1220", display: "flex", flexDirection: "column" }}>
              <div style={{ color: "#94a3b8", fontSize: 22 }}>{label}</div>
              <div style={{ marginTop: 10, fontSize: 44, fontWeight: 700 }}>{String(value)}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    imageSize
  );
}
