// components/vacancies/VacancyLocationMap.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { VacancyLocationDensity } from "@/utils/types/report.types";
import { useGetVacancyLocationDensity } from "@/utils/hooks/tanstack/report/use-get-vacancy-report";

// ─────────────────────────────────────────────────────────────

// Interpolate between two hex colors based on t ∈ [0,1]
function lerpColor(a: string, b: string, t: number): string {
  const hex = (s: string) => [
    parseInt(s.slice(1, 3), 16),
    parseInt(s.slice(3, 5), 16),
    parseInt(s.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

// ─────────────────────────────────────────────────────────────

function DensityMap({
  locations,
  selected,
  onSelect,
}: {
  locations: VacancyLocationDensity[];
  selected: VacancyLocationDensity | null;
  onSelect: (l: VacancyLocationDensity) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);

  const maxCount = useMemo(
    () => Math.max(1, ...locations.map((l) => l.vacancy_count)),
    [locations]
  );

  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as never as { _getIconUrl?: string })._getIconUrl;

      if (!containerRef.current) return;

      if (!mapRef.current) {
        const center: [number, number] =
          locations.length > 0
            ? [locations[0].lat, locations[0].lon]
            : [27.7172, 85.324];
        const map = L.map(containerRef.current).setView(center, 10);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);
        mapRef.current = map;
      }

      const map = mapRef.current;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const bounds: [number, number][] = [];

      locations.forEach((loc) => {
        if (loc == null || typeof loc.lat !== "number" || typeof loc.lon !== "number") return;

        const intensity = loc.vacancy_count / maxCount; // 0–1
        const color = lerpColor("#fbbf24", "#dc2626", intensity); // amber → red
        const isActive = selected?.location === loc.location;
        const radius = 12 + intensity * 24; // 12–36 px

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
              <!-- Hover card -->
              <div class="vac-hover-card" style="
                position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);
                background:white;border-radius:10px;padding:9px 12px;
                box-shadow:0 8px 24px rgba(0,0,0,0.18);
                border:2px solid ${isActive ? "#2563eb" : color};
                min-width:170px;white-space:nowrap;pointer-events:none;
                opacity:0;transition:opacity 0.15s ease;z-index:1000;
              ">
                <div style="font-weight:700;color:#111827;font-size:13px;margin-bottom:3px;">
                  📍 ${loc.location ?? "—"}
                </div>
                ${loc.location_hint ? `<div style="color:#6b7280;font-size:10px;margin-bottom:3px;">${loc.location_hint}</div>` : ""}
                <div style="color:#374151;font-size:12px;font-weight:600;">
                  ${loc.vacancy_count} vacanc${loc.vacancy_count === 1 ? "y" : "ies"}
                </div>
                <div style="position:absolute;bottom:-9px;left:50%;transform:translateX(-50%) rotate(45deg);
                  width:14px;height:14px;background:${isActive ? "#2563eb" : color};"></div>
              </div>

              <!-- Circle pin -->
              <div style="
                width:${radius}px;height:${radius}px;border-radius:50%;
                background:${isActive ? "#2563eb" : color};
                border:3px solid white;
                box-shadow:0 2px 8px rgba(0,0,0,0.25);
                display:flex;align-items:center;justify-content:center;
                color:white;font-size:${radius < 20 ? 9 : 11}px;font-weight:700;
                transition:transform 0.15s ease;
              ">
                ${loc.vacancy_count}
              </div>
            </div>
          `,
          iconSize: [Math.max(36, radius), Math.max(36, radius) + 50],
          iconAnchor: [Math.max(18, radius / 2), Math.max(36, radius) + 50],
        });

        const marker = L.marker([loc.lat, loc.lon], { icon }).addTo(map);

        marker.on("mouseover", (e) => {
          const el = (e.originalEvent.target as HTMLElement)?.closest(".leaflet-marker-icon");
          if (el) {
            const card = el.querySelector<HTMLElement>(".vac-hover-card");
            if (card) card.style.opacity = "1";
          }
        });
        marker.on("mouseout", (e) => {
          const el = (e.originalEvent.target as HTMLElement)?.closest(".leaflet-marker-icon");
          if (el) {
            const card = el.querySelector<HTMLElement>(".vac-hover-card");
            if (card) card.style.opacity = "0";
          }
        });
        marker.on("click", () => onSelect(loc));

        markersRef.current.push(marker);
        bounds.push([loc.lat, loc.lon]);
      });

      if (bounds.length > 0) {
        map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 13 });
      }
    });
  }, [locations, selected, onSelect, maxCount]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 px-3 py-2 bg-muted/40 border-b border-border text-[11px] font-medium text-muted-foreground">
        <span>{locations.length} location{locations.length !== 1 ? "s" : ""}</span>
        <span className="text-muted-foreground/60">· Circle size = vacancy density · Hover for details</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
          <span>Low</span>
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block ml-2" />
          <span>High</span>
        </div>
      </div>
      <div ref={containerRef} className="w-full bg-gray-50 dark:bg-slate-900" style={{ height: 400 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function LocationRankRow({
  loc,
  rank,
  maxCount,
  isSelected,
  onClick,
}: {
  loc: VacancyLocationDensity;
  rank: number;
  maxCount: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const pct = maxCount > 0 ? (loc.vacancy_count / maxCount) * 100 : 0;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg border-b border-border/30 last:border-0 transition-colors ${
        isSelected ? "bg-primary/10" : "hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono text-muted-foreground/60 w-4 shrink-0">
            #{rank}
          </span>
          <MapPin className={`w-3 h-3 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
          <p className="text-sm font-medium truncate">
            {loc.location ?? "—"}
          </p>
        </div>
        <span className="text-xs font-semibold text-foreground shrink-0">
          {loc.vacancy_count}
        </span>
      </div>
      {/* Progress bar */}
      <div className="ml-6 h-1.5 rounded-full bg-border/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: `hsl(${Math.round(4 + (1 - pct / 100) * 32)} 90% 55%)`,
          }}
        />
      </div>
      {loc.location_hint && (
        <p className="ml-6 text-[10px] text-muted-foreground/60 mt-1 truncate">
          {loc.location_hint}
        </p>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────

export function VacancyLocationMap() {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<VacancyLocationDensity | null>(null);
  const [mounted, setMounted] = useState(false);

  const { data, isLoading, isError, error } = useGetVacancyLocationDensity();

  const locations = useMemo(() => {
    const raw = data?.locations;
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (l) => l != null && typeof l.lat === "number" && typeof l.lon === "number"
    );
  }, [data]);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (l) =>
        (l.location ?? "").toLowerCase().includes(q) ||
        (l.location_hint ?? "").toLowerCase().includes(q)
    );
  }, [locations, filter]);

  const maxCount = useMemo(
    () => Math.max(1, ...filtered.map((l) => l.vacancy_count)),
    [filtered]
  );

  useEffect(() => {
    setMounted(true);
    if (!document.getElementById("leaflet-css")) {
      const el = document.createElement("link");
      el.id = "leaflet-css";
      el.rel = "stylesheet";
      el.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(el);
    }
  }, []);

  const handleSelect = (l: VacancyLocationDensity) =>
    setSelected((prev) => (prev?.location === l.location ? null : l));

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Vacancy density map</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locations.length} location{locations.length !== 1 ? "s" : ""} with coordinates
          </p>
        </div>
        <Input
          placeholder="Filter location..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 text-xs w-44"
          disabled={isLoading || isError}
        />
      </div>

      {isError ? (
        <div className="h-[400px] rounded-xl border border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm font-medium text-destructive">Failed to load vacancy locations</p>
          {error instanceof Error && (
            <p className="text-xs text-muted-foreground">{error.message}</p>
          )}
        </div>
      ) : isLoading ? (
        <div className="h-[400px] rounded-xl bg-muted animate-pulse" />
      ) : locations.length === 0 ? (
        <div className="h-[400px] rounded-xl border border-border/40 bg-muted/20 flex flex-col items-center justify-center gap-2">
          <MapPin className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No location data available</p>
        </div>
      ) : (
        <>
          {mounted && (
            <DensityMap
              locations={filtered}
              selected={selected}
              onSelect={handleSelect}
            />
          )}

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No results match "{filter}"
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto pr-0.5">
              {filtered.map((loc, i) => (
                <LocationRankRow
                  key={`${loc.location}-${i}`}
                  loc={loc}
                  rank={i + 1}
                  maxCount={maxCount}
                  isSelected={selected?.location === loc.location}
                  onClick={() => handleSelect(loc)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}