"use client";

/**
 * MapPicker — Leaflet-based map with:
 *  - OpenStreetMap tile layer
 *  - Nominatim search with autocomplete suggestions
 *  - Click-to-pin + draggable marker
 *  - Manual lat/lon inputs that move the marker
 *  - Confirm / Cancel buttons
 *
 * FIX: Replaced fragile onBlur/onFocus dropdown logic with a
 * mousedown-outside listener on a wrapper ref. This eliminates all
 * race conditions where blur fired before the suggestion click could register.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
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
  initialLat?: number;
  initialLon?: number;
  onConfirm: (lat: number, lon: number, address: string) => void;
  onClose: () => void;
}

interface Suggestion {
  label: string;
  lat: number;
  lon: number;
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

  // ── Suggestion dropdown: controlled by outside-click, not blur ────────────
  // This wrapper ref covers both the input AND the dropdown list.
  // A mousedown anywhere outside closes the dropdown — no blur race conditions.
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pinnedLat, setPinnedLat] = useState<number | null>(initialLat ?? null);
  const [pinnedLon, setPinnedLon] = useState<number | null>(initialLon ?? null);
  const [pinnedAddress, setPinnedAddress] = useState("");

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    function handleOutsideMouseDown(e: MouseEvent) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideMouseDown);
    return () => document.removeEventListener("mousedown", handleOutsideMouseDown);
  }, []);

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

    if (initialLat && initialLon) {
      placeMarker(map, initialLat, initialLon);
    }

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

  // ── Fetch suggestions as user types ──────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.trim();

    if (q.length < 3) {
      setSuggestions([]);
      // Don't hide the dropdown here — let the user see "No matches" if already open.
      // Only fully hide when input is too short.
      setShowSuggestions(false);
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
      return;
    }

    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);

    suggestDebounceRef.current = setTimeout(async () => {
      try {
        setSuggesting(true);
        // Open the dropdown as soon as we start fetching so the loader is visible
        setShowSuggestions(true);

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=0`
        );
        const data = (await res.json()) as Array<{
          display_name?: string;
          lat?: string;
          lon?: string;
        }>;

        const opts: Suggestion[] = data
          .map((x) => ({
            label: String(x.display_name ?? "").trim(),
            lat: Number(x.lat),
            lon: Number(x.lon),
          }))
          .filter((x) => x.label && Number.isFinite(x.lat) && Number.isFinite(x.lon))
          .slice(0, 6);

        setSuggestions(opts);
        // Keep dropdown open after results arrive
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggesting(false);
      }
    }, 300);

    return () => {
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    };
  }, [searchQuery]);

  // ── Helpers ───────────────────────────────────────────────────────────────

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

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();

      if (data.display_name) {
        // Real address found — show it in both the search bar and the address pill
        setPinnedAddress(data.display_name);
        setSearchQuery(data.display_name);
      } else {
        // No address from Nominatim — show coords only in the pill, clear the search bar
        setPinnedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setSearchQuery("");
      }
    } catch {
      // Network/parse error — same: coords in pill, search bar stays clean
      setPinnedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setSearchQuery("");
    }
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setShowSuggestions(false);
    setSuggestions([]);
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
      setSearchQuery(display_name);
    } catch {
      toast.error("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function applySuggestion(s: Suggestion) {
    setSearchQuery(s.label);
    setPinnedAddress(s.label);
    setSuggestions([]);
    setShowSuggestions(false);
    mapRef.current?.setView([s.lat, s.lon], 15);
    if (mapRef.current) placeMarker(mapRef.current, s.lat, s.lon);
    reverseGeocode(s.lat, s.lon);
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
    onConfirm(
      pinnedLat,
      pinnedLon,
      pinnedAddress || `${pinnedLat.toFixed(5)}, ${pinnedLon.toFixed(5)}`
    );
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length >= 3) {
      // Keep/open the dropdown as the user types; the useEffect will populate it
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  return (
    <div className="flex flex-col gap-0 bg-background rounded-2xl border border-border shadow-lg">
      {/* Header with search */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 border-b border-border/50 rounded-t-2xl">
        <div className="flex gap-2 mb-3">
          {/* ── Search wrapper: outside-click closes the dropdown ── */}
          <div ref={searchWrapperRef} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <Input
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              // No onFocus/onBlur needed — outside-click listener handles closing
              placeholder="Search location…"
              className="h-11 text-sm rounded-lg pl-10 pr-8 bg-white dark:bg-slate-800 border-border"
              disabled={searching}
            />

            {/* Clear button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && (
              <div className="absolute z-[1000] mt-1 w-full rounded-lg border border-border bg-background shadow-lg max-h-72 overflow-auto">
                {suggesting && (
                  <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Searching locations…
                  </div>
                )}
                {!suggesting && suggestions.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No matches.</div>
                )}
                {!suggesting &&
                  suggestions.map((s) => (
                    <button
                      key={`${s.lat}-${s.lon}-${s.label}`}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors border-b border-border/40 last:border-0"
                    >
                      <div className="truncate font-medium">{s.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {s.lat.toFixed(5)}, {s.lon.toFixed(5)}
                      </div>
                    </button>
                  ))}
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
        <p className="text-xs text-muted-foreground">
          Click the map to pin your location, drag the marker, or search above
        </p>
      </div>

      {/* Leaflet map */}
      <div
        ref={containerRef}
        style={{ height: 320, width: "100%" }}
        className="bg-gray-50 dark:bg-slate-900"
      />

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

        {pinnedAddress && (
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-3 py-2">
            <Search className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{pinnedAddress}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 p-4 border-t border-border/50 bg-background rounded-b-2xl">
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
          className="flex-1 h-11 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4 mr-2" />
          Confirm Location
        </Button>
      </div>
    </div>
  );
}