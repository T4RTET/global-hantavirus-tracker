"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { CountryStats } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

const icon = L.divIcon({
  className: "",
  html: '<div class="pulse-marker"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export function WorldMap({ countries }: { countries: CountryStats[] }) {
  return (
    <div className="h-[420px] overflow-hidden rounded-lg border bg-[#071014] md:h-[560px]">
      <MapContainer center={[18, 0]} maxBounds={[[-80, -190], [84, 190]]} minZoom={2} scrollWheelZoom={false} zoom={2}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {countries.map((country) => (
          <Marker icon={icon} key={country.id} position={[country.lat, country.lng]}>
            <Popup>
              <div className="min-w-48 space-y-2 text-sm">
                <div className="font-semibold">{country.name}</div>
                <div className="grid grid-cols-2 gap-2">
                  <span>Confirmed</span>
                  <strong className="text-right">{formatNumber(country.confirmed)}</strong>
                  <span>Suspected</span>
                  <strong className="text-right">{formatNumber(country.suspected)}</strong>
                  <span>Deaths</span>
                  <strong className="text-right">{formatNumber(country.deaths)}</strong>
                </div>
                <div className="text-xs opacity-80">Last report: {formatDate(country.last_report)}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
