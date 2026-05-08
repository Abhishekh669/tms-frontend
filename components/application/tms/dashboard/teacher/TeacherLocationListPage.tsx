// components/teachers/TeacherLocationList.tsx

"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AlertCircle, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

import type { TeacherLocation } from "@/utils/types/report.types";
import { useGetTeacherLocations } from "@/utils/hooks/tanstack/report/use-get-teacher-report";

// ─────────────────────────────────────────────────────────────

function LocationError({ message }: { message?: string }) {
  return (
    <div className="h-[420px] rounded-xl border border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-2">
      <AlertCircle className="w-5 h-5 text-destructive" />
      <p className="text-sm font-medium text-destructive">Failed to load teacher locations</p>
      {message && (
        <p className="text-xs text-muted-foreground max-w-xs text-center">{message}</p>
      )}
    </div>
  );
}

function LocationEmpty() {
  return (
    <div className="h-[420px] rounded-xl border border-border/40 bg-muted/20 flex flex-col items-center justify-center gap-2">
      <MapPin className="w-6 h-6 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No location data available</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function TeacherMap({
  teachers,
  selected,
  onSelect,
}: {
  teachers: TeacherLocation[];
  selected: TeacherLocation | null;
  onSelect: (t: TeacherLocation) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);

  useEffect(() => {
    import("leaflet").then((L) => {
      delete (
        L.Icon.Default.prototype as never as { _getIconUrl?: string }
      )._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!containerRef.current) return;

      if (!mapRef.current) {
        const center: [number, number] =
          teachers.length > 0
            ? [teachers[0].lat, teachers[0].long]
            : [27.7172, 85.324];

        // ── CHANGE 1: bumped fallback zoom 11 → 13 ──
        const map = L.map(containerRef.current).setView(center, 13);

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          { attribution: "© OpenStreetMap contributors" }
        ).addTo(map);

        mapRef.current = map;
      }

      const map = mapRef.current;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const bounds: [number, number][] = [];

      teachers.forEach((t) => {
        if (
          t == null ||
          typeof t.lat !== "number" ||
          typeof t.long !== "number"
        ) {
          return;
        }

        const isActive = selected?.phone === t.phone;

        // Pin-only icon — no label shown until hover
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              position: relative;
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
            ">
              <!-- Hover card (hidden by default) -->
              <div class="teacher-hover-card" style="
                position: absolute;
                bottom: calc(100% + 8px);
                left: 50%;
                transform: translateX(-50%);
                background: white;
                border-radius: 10px;
                padding: 10px 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.18);
                border: 2px solid ${isActive ? "#2563eb" : "#dc2626"};
                min-width: 180px;
                max-width: 240px;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.15s ease;
                z-index: 1000;
              ">
                <div style="font-weight: 700; color: #111827; font-size: 13px; margin-bottom: 3px;">
                  ${t.name ?? "Unknown"}
                </div>
                <div style="color: #4b5563; font-size: 11px; margin-bottom: 3px;">
                  📍 ${t.location ?? "—"}
                </div>
                ${
                  t.location_hint
                    ? `<div style="color: #6b7280; font-size: 10px; margin-bottom: 3px;">${t.location_hint}</div>`
                    : ""
                }
                <div style="color: #374151; font-size: 11px;">
                  📞 ${t.phone ?? "—"}
                </div>
                <!-- Arrow -->
                <div style="
                  position: absolute;
                  bottom: -9px;
                  left: 50%;
                  transform: translateX(-50%) rotate(45deg);
                  width: 14px;
                  height: 14px;
                  background: ${isActive ? "#2563eb" : "#dc2626"};
                "></div>
              </div>

              <!-- Pin dot -->
              <div style="
                width: ${isActive ? 18 : 14}px;
                height: ${isActive ? 18 : 14}px;
                border-radius: 50%;
                background: ${isActive ? "#2563eb" : "#dc2626"};
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                transition: transform 0.15s ease;
              "></div>
            </div>
          `,
          iconSize: [240, 60],
          iconAnchor: [120, 50],
        });

        const marker = L.marker([t.lat, t.long], { icon }).addTo(map);

        // Show hover card on mouseover, hide on mouseout
        marker.on("mouseover", (e) => {
          const el = (e.originalEvent.target as HTMLElement)?.closest(
            ".leaflet-marker-icon"
          );
          if (el) {
            const card = el.querySelector<HTMLElement>(".teacher-hover-card");
            if (card) card.style.opacity = "1";
          }
        });

        marker.on("mouseout", (e) => {
          const el = (e.originalEvent.target as HTMLElement)?.closest(
            ".leaflet-marker-icon"
          );
          if (el) {
            const card = el.querySelector<HTMLElement>(".teacher-hover-card");
            if (card) card.style.opacity = "0";
          }
        });

        marker.on("click", () => onSelect(t));

        markersRef.current.push(marker);
        bounds.push([t.lat, t.long]);
      });

      if (bounds.length > 0) {
        // ── CHANGE 2: raised maxZoom 13 → 15, tighter padding ──
        map.fitBounds(L.latLngBounds(bounds), {
          padding: [40, 40],
          maxZoom: 15,
        });

        // ── CHANGE 3: single result → force street-level zoom ──
        if (bounds.length === 1) {
          map.setZoom(15);
        }
      }
    });
  }, [teachers, selected, onSelect]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 bg-muted/40 border-b border-border text-[11px] font-medium text-muted-foreground">
        <span>
          {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} on map
        </span>
        <span className="text-muted-foreground/60">· Hover a pin to see details</span>
      </div>
      <div
        ref={containerRef}
        className="w-full bg-gray-50 dark:bg-slate-900"
        style={{ height: 420 }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function LocationRow({
  t,
  isSelected,
  onClick,
}: {
  t: TeacherLocation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const name = t.name ?? "Unknown teacher";
  const location = t.location ?? "—";
  const phone = t.phone ?? "—";
  const locationHint = t.location_hint ?? null;
  const lat = typeof t.lat === "number" ? t.lat.toFixed(5) : "—";
  const long = typeof t.long === "number" ? t.long.toFixed(5) : "—";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start justify-between gap-4 py-3 px-2 rounded-lg border-b border-border/40 last:border-0 transition-colors ${
        isSelected ? "bg-primary/10 border-primary/20" : "hover:bg-muted/50"
      }`}
    >
      <div className="min-w-0 flex items-start gap-2.5">
        <MapPin
          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
            isSelected ? "text-primary" : "text-muted-foreground"
          }`}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {location}
            {locationHint ? ` · ${locationHint}` : ""}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-xs font-mono text-muted-foreground">{phone}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          {lat}, {long}
        </p>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────

export function TeacherLocationList() {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<TeacherLocation | null>(null);
  const [mounted, setMounted] = useState(false);

  const { data, isLoading, isError, error } = useGetTeacherLocations();

  const locations = useMemo(() => {
    const raw = data?.locations;
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (t) =>
        t != null &&
        typeof t.lat === "number" &&
        typeof t.long === "number"
    );
  }, [data]);

  useEffect(() => {
    setMounted(true);

    const link = document.getElementById("leaflet-css");
    if (!link) {
      const el = document.createElement("link");
      el.id = "leaflet-css";
      el.rel = "stylesheet";
      el.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(el);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (t) =>
        (t.name ?? "").toLowerCase().includes(q) ||
        (t.location ?? "").toLowerCase().includes(q) ||
        (t.location_hint ?? "").toLowerCase().includes(q)
    );
  }, [locations, filter]);

  const handleSelect = (t: TeacherLocation) => {
    setSelected((prev) => (prev?.phone === t.phone ? null : t));
  };

  const errorMessage =
    error instanceof Error ? error.message : undefined;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Teacher locations</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locations.length} teacher{locations.length !== 1 ? "s" : ""} with location data
          </p>
        </div>

        <Input
          placeholder="Filter by name or area..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 text-xs w-48"
          disabled={isLoading || isError}
        />
      </div>

      {isError ? (
        <LocationError message={errorMessage} />
      ) : isLoading ? (
        <div className="h-[420px] rounded-xl bg-muted animate-pulse" />
      ) : locations.length === 0 ? (
        <LocationEmpty />
      ) : (
        <>
          {mounted && (
            <TeacherMap
              teachers={filtered}
              selected={selected}
              onSelect={handleSelect}
            />
          )}

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No results match "{filter}"
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto pr-1 space-y-0.5">
              {filtered.map((t, i) => (
                <LocationRow
                  key={`${t.phone ?? i}-${i}`}
                  t={t}
                  isSelected={selected?.phone === t.phone}
                  onClick={() => handleSelect(t)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}