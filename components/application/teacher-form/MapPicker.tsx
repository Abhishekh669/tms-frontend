"use client";

/**
 * MapPicker — Leaflet-based map with:
 *  - OpenStreetMap tile layer
 *  - Nominatim search (type & press Enter or click Search)
 *  - Click-to-pin + draggable marker
 *  - Manual lat/lon inputs that move the marker
 *  - Confirm / Cancel buttons
 *
 * This component is browser-only. Import it with:
 *   const MapPicker = dynamic(() => import("./map-picker"), { ssr: false });
 *
 * Install once:  npm install leaflet @types/leaflet
 * Add to next.config: transpilePackages: ["leaflet"]  (if needed)
 */

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Fix Leaflet's default marker icon paths broken by webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPickerProps {
  /** Pre-selected coordinates (e.g. from a previous session) */
  initialLat?: number;
  initialLon?: number;
  /** Called when the user clicks "Confirm location" */
  onConfirm: (lat: number, lon: number, address: string) => void;
  /** Called when the user clicks "Cancel" */
  onClose: () => void;
}

export default function MapPicker({
  initialLat,
  initialLon,
  onConfirm,
  onClose,
}: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { label: string; lat: number; lon: number }[]
  >([]);
  const [suggesting, setSuggesting] = useState(false);
  const suggestDebounceRef = useRef<number | null>(null);
  const [pinnedLat, setPinnedLat] = useState<number | null>(initialLat ?? null);
  const [pinnedLon, setPinnedLon] = useState<number | null>(initialLon ?? null);
  const [pinnedAddress, setPinnedAddress] = useState("");

  // ── Initialise map once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] =
      initialLat && initialLon ? [initialLat, initialLon] : [27.7172, 85.324];

    const map = L.map(containerRef.current).setView(defaultCenter, initialLat ? 14 : 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    // Place initial marker if coords supplied
    if (initialLat && initialLon) {
      placeMarker(map, initialLat, initialLon);
    }

    // Click-to-pin
    map.on("click", (e: L.LeafletMouseEvent) => {
      placeMarker(map, e.latlng.lat, e.latlng.lng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Suggest as user types (Nominatim) ─────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    if (suggestDebounceRef.current) window.clearTimeout(suggestDebounceRef.current);
    suggestDebounceRef.current = window.setTimeout(async () => {
      try {
        setSuggesting(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=0`
        );
        const data = (await res.json()) as Array<{
          display_name?: string;
          lat?: string;
          lon?: string;
        }>;
        const opts = data
          .map((x) => ({
            label: String(x.display_name ?? "").trim(),
            lat: Number(x.lat),
            lon: Number(x.lon),
          }))
          .filter((x) => x.label && Number.isFinite(x.lat) && Number.isFinite(x.lon))
          .slice(0, 6);
        setSuggestions(opts);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggesting(false);
      }
    }, 300);
    return () => {
      if (suggestDebounceRef.current) window.clearTimeout(suggestDebounceRef.current);
    };
  }, [searchQuery]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function placeMarker(map: L.Map, lat: number, lng: number) {
    if (markerRef.current) map.removeLayer(markerRef.current);
    const m = L.marker([lat, lng], { draggable: true }).addTo(map);
    m.on("dragend", (e: L.DragEndEvent) => {
      const { lat, lng } = (e.target as L.Marker).getLatLng();
      setPinnedLat(lat);
      setPinnedLon(lng);
      reverseGeocode(lat, lng);
    });
    markerRef.current = m;
    setPinnedLat(lat);
    setPinnedLon(lng);
  }

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setPinnedAddress(addr);
      setSearchQuery(addr);
    } catch {
      setPinnedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  }

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
      );
      const data = await res.json();
      if (!data?.length) {
        toast.error("No results found. Try a different search term.");
        return;
      }
      const { lat, lon, display_name } = data[0];
      const latN = parseFloat(lat);
      const lonN = parseFloat(lon);
      mapRef.current?.setView([latN, lonN], 15);
      placeMarker(mapRef.current!, latN, lonN);
      setPinnedAddress(display_name);
    } catch {
      toast.error("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function applySuggestion(s: { label: string; lat: number; lon: number }) {
    setSearchQuery(s.label);
    setPinnedAddress(s.label);
    mapRef.current?.setView([s.lat, s.lon], 15);
    if (mapRef.current) placeMarker(mapRef.current, s.lat, s.lon);
    // Keep a canonical address (reverse may enrich; okay to fire and update)
    reverseGeocode(s.lat, s.lon);
    setSuggestions([]);
  }

  function handleLatLonChange(lat: number | null, lon: number | null) {
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return;
    mapRef.current?.setView([lat, lon], 14);
    placeMarker(mapRef.current!, lat, lon);
    reverseGeocode(lat, lon);
  }
  
  function handleConfirm() {
    if (pinnedLat === null || pinnedLon === null) {
      toast.error("Please pin a location on the map first.");
      return;
    }
    onConfirm(pinnedLat, pinnedLon, pinnedAddress || `${pinnedLat.toFixed(5)}, ${pinnedLon.toFixed(5)}`);
  }

  return (
    <div className="flex flex-col gap-0 bg-background rounded-2xl border border-border shadow-lg">
      {/* Header with search */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 border-b border-border/50 rounded-t-2xl">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search location…"
              className="h-11 text-sm rounded-lg pl-10 bg-white dark:bg-slate-800 border-border"
              disabled={searching}
            />

            {(suggesting || suggestions.length > 0) && searchQuery.trim().length >= 3 && (
              <div className="absolute z-[1000] mt-1 w-full rounded-lg border border-border bg-background shadow-lg max-h-72 overflow-auto">
                {suggesting && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Searching locations…
                  </div>
                )}
                {!suggesting &&
                  suggestions.map((s) => (
                    <button
                      key={`${s.lat}-${s.lon}-${s.label}`}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors"
                    >
                      <div className="truncate">{s.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {s.lat.toFixed(5)}, {s.lon.toFixed(5)}
                      </div>
                    </button>
                  ))}
                {!suggesting && suggestions.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No matches.</div>
                )}
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="h-11 px-4 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Searching</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Click the map to pin your location or search above</p>
      </div>

      {/* Leaflet map */}
      <div ref={containerRef} style={{ height: 320, width: "100%" }} className="bg-gray-50 dark:bg-slate-900" />

      {/* Coordinate inputs */}
      <div className="bg-muted/20 dark:bg-slate-800/30 px-4 py-3 border-t border-border/50">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-2">Latitude</label>
            <Input
              type="number"
              step="any"
              placeholder="27.7172"
              value={pinnedLat ?? ""}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setPinnedLat(isNaN(v) ? null : v);
                handleLatLonChange(isNaN(v) ? null : v, pinnedLon);
              }}
              className="h-10 text-sm rounded-lg bg-white dark:bg-slate-800 border-border"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-2">Longitude</label>
            <Input
              type="number"
              step="any"
              placeholder="85.3240"
              value={pinnedLon ?? ""}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setPinnedLon(isNaN(v) ? null : v);
                handleLatLonChange(pinnedLat, isNaN(v) ? null : v);
              }}
              className="h-10 text-sm rounded-lg bg-white dark:bg-slate-800 border-border"
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 p-4 border-t border-border/50 bg-background">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 h-11 rounded-lg text-sm font-medium"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={pinnedLat === null || pinnedLon === null}
          className="flex-1 h-11 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4 mr-2" />
          Confirm
        </Button>
      </div>
    </div>
  );
}
