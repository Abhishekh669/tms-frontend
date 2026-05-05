"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Copy,
  CheckCheck,
  Search,
  User,
  Phone,
  GraduationCap,
  Clock,
  Users,
  Wallet,
  BookOpen,
  Navigation,
  Star,
  ChevronRight,
  Briefcase,
  MessageCircle,
  X,
  ChevronDown,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { UpdateVacancy, VacancyTypeById } from "@/utils/types/vacancy.types";
import { useGetVacancyById } from "@/utils/hooks/tanstack/vacancy/use-get-vacancy-list";
import { useParams, useRouter } from "next/navigation";
import { User as UserType } from "@/utils/types/user.types";
import { useGetNearbyTeachers } from "@/utils/hooks/tanstack/vacancy/use-get-near-by-teacher";
import { updateVacancyData } from "@/utils/action/vacancy/vacancy.put";
import type { Teacher as ApiTeacher } from "@/utils/types/teacher.types";
import { useQueryClient } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { EditVacancyDialog } from "./UpdateVacancy";
import { deleteVacancyById } from "@/utils/action/vacancy/vacancy.delete";

const MapPicker = dynamic(
  () => import("@/components/application/teacher-form/MapPicker"),
  { ssr: false }
);

// Leaflet default marker icon fix
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Types ────────────────────────────────────────────────────────────────────
type Teacher = ApiTeacher;
type SearchMode = "vacancy" | "custom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWhatsAppMessage(vacancy: VacancyTypeById, _user: UserType): string {
  const genderEmoji =
    vacancy.gender === "female" ? "👩‍🏫" : vacancy.gender === "male" ? "👨‍🏫" : "🧑‍🏫";

  return (
    `🏫 HOME TUITION REQUIREMENT 🏫\n\n` +
    `📌 Reference ID: ${vacancy.code}\n\n` +
    `📍 Location: ${vacancy.location}${vacancy.location_hint ? ` (${vacancy.location_hint})` : ""}\n` +
    `🎓 Class / Grade: ${vacancy.grade}\n` +
    `⏰ Preferred Time: ${vacancy.time}\n` +
    `👨‍🎓 Number of Students: ${vacancy.no_of_students}\n` +
    `📖 Subject: ${vacancy.subject || "—"}\n` +
    `💰 Salary: NPR ${vacancy.salary.toFixed(0)}\n` +
    `${genderEmoji} Gender Preference: ${vacancy.gender === "other" ? "Any" : vacancy.gender}\n\n` +
    `✨ Interested teachers, please reach out to:\n` +
    `📲 WhatsApp: 9741660035/9769289209\n` +
    `💼 Commission: ${vacancy.commission_charge}% of first month's salary\n`
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className="mt-0.5 text-primary flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    open: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    assigned: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    ongoing: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    completed: "bg-slate-500/15 text-slate-600 border-slate-500/30",
    cancelled: "bg-red-500/15 text-red-600 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        colorMap[status] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteConfirmDialog({
  open,
  onOpenChange,
  vacancyTitle,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyTitle: string;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Vacancy
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">"{vacancyTitle}"</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete vacancy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Map ──────────────────────────────────────────────────────────────────────

function makePinIcon(color: string, emoji: string, size: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="
          width:${size}px;height:${size}px;
          background:${color};
          border:3px solid #fff;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 3px 10px ${color}80;
        "></div>
        <span style="
          position:absolute;
          top:50%;left:50%;
          transform:translate(-50%,-62%);
          font-size:${Math.round(size * 0.4)}px;
          line-height:1;
          pointer-events:none;
          user-select:none;
        ">${emoji}</span>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 4)],
  });
}

const tuitionIcon = makePinIcon("#2563eb", "🏫", 38);
const teacherIcon = makePinIcon("#dc2626", "👤", 32);

function NearbyTeachersMap(props: {
  tuitionLat: number;
  tuitionLon: number;
  tuitionLabel: string;
  teachers: Teacher[];
}) {
  const { tuitionLat, tuitionLon, tuitionLabel, teachers } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tuitionMarkerRef = useRef<L.Marker | null>(null);
  const teacherLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!Number.isFinite(tuitionLat) || !Number.isFinite(tuitionLon)) return;
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current).setView([tuitionLat, tuitionLon], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      teacherLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = mapRef.current!;

    const tuitionPopup = `<div style="font-size:13px;min-width:160px;">
      <div style="font-weight:700;color:#1d4ed8;margin-bottom:3px;">🏫 Tuition Location</div>
      <div style="color:#374151;margin-bottom:2px;">${tuitionLabel}</div>
      <div style="color:#9ca3af;font-size:11px;">${tuitionLat.toFixed(5)}, ${tuitionLon.toFixed(5)}</div>
    </div>`;

    if (!tuitionMarkerRef.current) {
      tuitionMarkerRef.current = L.marker([tuitionLat, tuitionLon], { icon: tuitionIcon })
        .addTo(map)
        .bindPopup(tuitionPopup, { maxWidth: 280 })
        .bindTooltip("🏫 Tuition location", {
          direction: "top",
          offset: [0, -10],
          opacity: 0.95,
          sticky: true,
        });
    } else {
      tuitionMarkerRef.current.setLatLng([tuitionLat, tuitionLon]);
      tuitionMarkerRef.current.setPopupContent(tuitionPopup);
    }

    const validTeachers = (teachers ?? []).filter(
      (t): t is Teacher & { lat: number; long: number } =>
        t.lat != null &&
        t.long != null &&
        Number.isFinite(t.lat) &&
        Number.isFinite(t.long)
    );

    teacherLayerRef.current?.clearLayers();
    validTeachers.forEach((t) => {
      L.marker([t.lat, t.long], { icon: teacherIcon })
        .addTo(teacherLayerRef.current ?? map)
        .bindTooltip(
          `<div style="font-size:12px;font-weight:700;">${t.name}</div><div style="font-size:11px;opacity:.9;">📞 ${t.phone}</div>`,
          { direction: "top", offset: [0, -10], opacity: 0.95, sticky: true }
        )
        .bindPopup(
          `<div style="font-size:13px;min-width:190px;">
            <div style="font-weight:700;color:#b91c1c;margin-bottom:4px;">👤 ${t.name}</div>
            <div style="color:#374151;">${t.location}</div>
            ${t.location_hint ? `<div style="color:#6b7280;font-size:11px;">${t.location_hint}</div>` : ""}
            <div style="color:#374151;margin-top:5px;">📞 ${t.phone}</div>
            <div style="margin-top:5px;display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
              <span style="background:#f3f4f6;color:#374151;padding:1px 7px;border-radius:4px;font-size:11px;text-transform:capitalize;">${t.gender}</span>
              <span style="background:#fee2e2;color:#b91c1c;padding:1px 7px;border-radius:4px;font-size:11px;font-weight:600;">${t.status ?? "vacant"}</span>
            </div>
            ${Number.isFinite(t.lat) && Number.isFinite(t.long) ? `<div style="color:#9ca3af;font-size:11px;margin-top:5px;">${t.lat.toFixed(5)}, ${t.long.toFixed(5)}</div>` : ""}
          </div>`,
          { maxWidth: 300 }
        );
    });

    const allPoints: L.LatLngExpression[] = [
      [tuitionLat, tuitionLon],
      ...validTeachers.map((t) => [t.lat, t.long] as L.LatLngExpression),
    ];
    if (allPoints.length > 1) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [48, 48] });
    } else {
      map.setView([tuitionLat, tuitionLon], 14);
    }
  }, [tuitionLat, tuitionLon, tuitionLabel, teachers]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      tuitionMarkerRef.current = null;
      teacherLayerRef.current = null;
    };
  }, []);

  if (!Number.isFinite(tuitionLat) || !Number.isFinite(tuitionLon)) {
    return (
      <div className="rounded-xl overflow-hidden border border-border shadow-sm">
        <div className="px-3 py-2 bg-muted/40 border-b border-border text-[11px] font-medium text-muted-foreground">
          Map unavailable (missing location)
        </div>
        <div className="w-full h-[220px] md:h-[260px] bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-sm text-muted-foreground">
          No latitude/longitude provided for this vacancy.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-sm">
      <div className="flex items-center gap-3 px-3 py-2 bg-muted/40 border-b border-border text-[11px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm inline-block" />
          Tuition location
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600 border-2 border-white shadow-sm inline-block" />
          Teacher location
        </span>
        <span className="ml-auto text-[11px]">
          {(teachers ?? []).length} teacher{(teachers ?? []).length !== 1 ? "s" : ""} returned
        </span>
      </div>
      <div ref={containerRef} className="bg-gray-50 dark:bg-slate-900 w-full h-[320px] md:h-[420px]" />
    </div>
  );
}

// ─── Search panel ─────────────────────────────────────────────────────────────

interface SearchPanelProps {
  vacancy: VacancyTypeById;
  vacancyId: string;
}

function SearchPanel({ vacancy, vacancyId }: SearchPanelProps) {
  const [mode, setMode] = useState<SearchMode>("vacancy");
  const [searchLat, setSearchLat] = useState("");
  const [searchLon, setSearchLon] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [showPickerMap, setShowPickerMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationPicking, setLocationPicking] = useState(false);
  const [locationOptions, setLocationOptions] = useState<
    { label: string; lat: number; lon: number }[]
  >([]);
  const locationDebounceRef = useRef<number | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searched, setSearched] = useState(false);
  const [request, setRequest] = useState<{ lat?: number; lon?: number; location?: string }>({});
  const [runSearch, setRunSearch] = useState(false);

  const nearbyQuery = useGetNearbyTeachers(
    vacancyId,
    request.lat,
    request.lon,
    request.location,
    { enabled: runSearch }
  );

  const searching = nearbyQuery.isFetching;

  const handleAssignTuition = (teacher: Teacher) => {
    toast.message("Assign tuition (dummy)", {
      description: `${teacher.name} · ${teacher.phone}`,
    });
  };

  const handleMapConfirm = useCallback(
    (lat: number, lon: number, address: string) => {
      setSearchLat(String(lat));
      setSearchLon(String(lon));
      setSearchLocation(address);
      setShowPickerMap(false);
      toast.success("Location selected");
    },
    []
  );

  const handleUseVacancyLocation = () => {
    setSearchLat(String(vacancy.lat));
    setSearchLon(String(vacancy.lon));
    setSearchLocation(vacancy.location);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setSearchLat(String(latitude));
        setSearchLon(String(longitude));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const d = await res.json();
          setSearchLocation(d.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch {
          setSearchLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        toast.error("Could not get location: " + err.message);
      }
    );
  };

  const clearCustomLocation = () => {
    setSearchLat("");
    setSearchLon("");
    setSearchLocation("");
    setLocationOptions([]);
  };

  useEffect(() => {
    if (mode !== "custom") return;
    const q = searchLocation.trim();
    if (q.length < 3) {
      setLocationOptions([]);
      return;
    }
    if (locationDebounceRef.current) window.clearTimeout(locationDebounceRef.current);
    locationDebounceRef.current = window.setTimeout(async () => {
      try {
        setLocationPicking(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=0`
        );
        const list = (await res.json()) as Array<{ display_name?: string; lat?: string; lon?: string }>;
        setLocationOptions(
          list
            .map((x) => ({ label: String(x.display_name ?? "").trim(), lat: Number(x.lat), lon: Number(x.lon) }))
            .filter((x) => x.label.length > 0 && Number.isFinite(x.lat) && Number.isFinite(x.lon))
            .slice(0, 6)
        );
      } catch {
        setLocationOptions([]);
      } finally {
        setLocationPicking(false);
      }
    }, 350);
    return () => { if (locationDebounceRef.current) window.clearTimeout(locationDebounceRef.current); };
  }, [mode, searchLocation]);

  const handleSearch = async () => {
    setSearched(false);
    try {
      let lat: number | undefined;
      let lon: number | undefined;
      let location: string | undefined;

      if (mode === "custom") {
        const latNum = Number(searchLat);
        const lonNum = Number(searchLon);
        const loc = searchLocation.trim();

        if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
          lat = latNum;
          lon = lonNum;
          location = loc || undefined;
        } else if (loc) {
          const first = locationOptions[0];
          if (first) {
            lat = first.lat; lon = first.lon; location = first.label;
            setSearchLat(String(first.lat)); setSearchLon(String(first.lon)); setSearchLocation(first.label);
          } else {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}&limit=1`);
            const list = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
            const item = list?.[0];
            const gLat = Number(item?.lat); const gLon = Number(item?.lon);
            if (Number.isFinite(gLat) && Number.isFinite(gLon)) {
              lat = gLat; lon = gLon; location = String(item?.display_name ?? loc);
              setSearchLat(String(gLat)); setSearchLon(String(gLon)); setSearchLocation(location);
            }
          }
        }
      }
      setRequest({ lat, lon, location });
      setRunSearch(true);
      const res = await nearbyQuery.refetch();
      const payload = res.data as unknown as { teachers?: unknown };
      setTeachers(Array.isArray(payload?.teachers) ? (payload.teachers as Teacher[]) : []);
      setSearched(true);
    } catch {
      toast.error("Failed to search teachers");
    }
  };

  const hasCustomCoords =
    searchLat !== "" && searchLon !== "" &&
    Number.isFinite(Number(searchLat)) && Number.isFinite(Number(searchLon));

  useEffect(() => {
    if (searchLocation.trim().length === 0) setLocationOptions([]);
  }, [searchLocation]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Search Nearby Teachers
          <Badge variant="outline" className="ml-auto text-[10px]">5 km radius</Badge>
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-2 p-1 rounded-xl bg-muted w-fit">
          <button
            onClick={() => { setMode("vacancy"); setSearched(false); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === "vacancy" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <MapPin className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
            Vacancy location
          </button>
          <button
            onClick={() => { setMode("custom"); setSearched(false); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === "custom" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Navigation className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
            Custom location
          </button>
        </div>

        {mode === "vacancy" && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/15 text-sm text-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="font-medium truncate">{vacancy.location}</span>
            {vacancy.location_hint && <span className="text-muted-foreground truncate">— {vacancy.location_hint}</span>}
            {Number.isFinite(vacancy.lat) && Number.isFinite(vacancy.lon) && (
              <span className="ml-auto text-[11px] text-muted-foreground flex-shrink-0">
                {vacancy.lat.toFixed(4)}, {vacancy.lon.toFixed(4)}
              </span>
            )}
          </div>
        )}

        {mode === "custom" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="relative md:col-span-1">
                <Input
                  placeholder="Location name (optional)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
                {searchLocation && (
                  <button onClick={() => setSearchLocation("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {searchLocation.trim().length >= 3 && (locationPicking || locationOptions.length > 0) && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                    {locationPicking && <div className="px-3 py-2 text-xs text-muted-foreground">Searching locations…</div>}
                    {!locationPicking && locationOptions.map((opt) => (
                      <button
                        key={`${opt.lat}-${opt.lon}-${opt.label}`}
                        type="button"
                        onClick={() => { setSearchLocation(opt.label); setSearchLat(String(opt.lat)); setSearchLon(String(opt.lon)); setLocationOptions([]); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors"
                      >
                        <div className="truncate">{opt.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{opt.lat.toFixed(5)}, {opt.lon.toFixed(5)}</div>
                      </button>
                    ))}
                    {!locationPicking && locationOptions.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No matches.</div>}
                  </div>
                )}
              </div>
              <Input placeholder="Latitude" type="number" value={searchLat} onChange={(e) => setSearchLat(e.target.value)} />
              <Input placeholder="Longitude" type="number" value={searchLon} onChange={(e) => setSearchLon(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleUseVacancyLocation}>
                <MapPin className="w-3.5 h-3.5 mr-1.5" />Use vacancy location
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleMyLocation} disabled={locating}>
                <Navigation className="w-3.5 h-3.5 mr-1.5" />{locating ? "Detecting..." : "My location"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPickerMap((v) => !v)}>
                <MapPin className="w-3.5 h-3.5 mr-1.5" />{showPickerMap ? "Close map" : "Pick on map"}
              </Button>
              {hasCustomCoords && (
                <Button type="button" variant="ghost" size="sm" onClick={clearCustomLocation} className="text-muted-foreground">
                  <X className="w-3.5 h-3.5 mr-1" />Clear
                </Button>
              )}
            </div>
            {hasCustomCoords && (
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[11px] font-normal">
                  <MapPin className="w-3 h-3 mr-1" />
                  {Number(searchLat).toFixed(5)}, {Number(searchLon).toFixed(5)}
                  {searchLocation && ` — ${searchLocation.slice(0, 60)}${searchLocation.length > 60 ? "…" : ""}`}
                </Badge>
              </div>
            )}
            {showPickerMap && (
              <MapPicker
                initialLat={searchLat && Number.isFinite(Number(searchLat)) ? Number(searchLat) : undefined}
                initialLon={searchLon && Number.isFinite(Number(searchLon)) ? Number(searchLon) : undefined}
                onConfirm={handleMapConfirm}
                onClose={() => setShowPickerMap(false)}
              />
            )}
          </div>
        )}

        <Button onClick={handleSearch} disabled={searching} className="gap-1.5 w-full sm:w-auto">
          <Search className="w-3.5 h-3.5" />
          {searching ? "Searching…" : mode === "vacancy" ? "Find teachers near vacancy" : "Find teachers near location"}
        </Button>

        {searched && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {teachers.length > 0 ? `${teachers.length} teacher${teachers.length !== 1 ? "s" : ""} found nearby` : "No teachers found nearby"}
              </p>
              {teachers.length > 0 && <Badge variant="secondary" className="text-[10px]">Sorted by distance</Badge>}
            </div>

            {teachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <User className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">No teachers found in this area</p>
                <p className="text-xs mt-1">Try a different location or expand the search radius</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border overflow-hidden">
                  <TooltipProvider>
                    <div className="max-h-[420px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-background">
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="w-[220px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coords</TableHead>
                            <TableHead className="w-[160px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teachers.map((t) => {
                            const coords = Number.isFinite(t.lat ?? NaN) && Number.isFinite(t.long ?? NaN)
                              ? `${(t.lat as number).toFixed(4)}, ${(t.long as number).toFixed(4)}`
                              : "—";
                            return (
                              <TableRow key={t.id} className="border-border hover:bg-muted/40 transition-colors">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold">
                                      {t.name?.charAt(0)?.toUpperCase() ?? "T"}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-foreground leading-tight truncate">{t.name}</div>
                                      <div className="text-[11px] text-muted-foreground capitalize">{t.gender}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Phone className="w-3 h-3" />{t.phone}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-[180px] truncate cursor-default">
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{t.location}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="rounded-xl text-xs max-w-[340px]">
                                      <p className="font-medium text-foreground">{t.location}</p>
                                      {t.location_hint && <p className="text-muted-foreground">{t.location_hint}</p>}
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="rounded-full text-[11px] font-semibold capitalize">{t.status ?? "—"}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {t.cv_link ? <a href={t.cv_link} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline underline-offset-2">CV</a> : <span className="text-xs text-muted-foreground/50 italic">—</span>}
                                    {t.transcript_link ? <a href={t.transcript_link} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline underline-offset-2">Transcript</a> : null}
                                    {t.addition_link ? <a href={t.addition_link} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline underline-offset-2">Additional</a> : null}
                                  </div>
                                </TableCell>
                                <TableCell><span className="text-xs text-muted-foreground">{coords}</span></TableCell>
                                <TableCell className="text-right">
                                  <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => handleAssignTuition(t)}>
                                    Assign tuition
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </TooltipProvider>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Map</p>
                    <p className="text-xs text-muted-foreground">Blue pin = tuition · Red pins = teachers</p>
                  </div>
                  <NearbyTeachersMap
                    tuitionLat={Number(vacancy.lat)}
                    tuitionLon={Number(vacancy.lon)}
                    tuitionLabel={`${vacancy.location}${vacancy.location_hint ? ` — ${vacancy.location_hint}` : ""}`}
                    teachers={teachers}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VacancyIdPage({ user }: { user: UserType }) {
  if (!user) return null;

  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const vacancyId = (params?.["vac-id"] ?? params?.id ?? "") as string;

  const { data, isLoading, error } = useGetVacancyById(vacancyId);
  const vacancy: VacancyTypeById | undefined = data?.vacancy;

  const [copied, setCopied] = useState(false);

  // ── Edit dialog state ──
  const [editOpen, setEditOpen] = useState(false);

  // ── Delete dialog state ──
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!vacancyId) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground text-sm">
        Loading vacancy details…
      </div>
    );
  }

  if (error || !vacancy) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-destructive text-sm">
        Failed to load vacancy.
      </div>
    );
  }

  // ── Update handler — async so EditVacancyDialog waits before closing ──
  const handleUpdateVacancy = async (
    updatedData: Parameters<React.ComponentProps<typeof EditVacancyDialog>["onUpdate"]>[0]
  ) => {
    const payload: UpdateVacancy = {
      id: vacancy.id,
      title: updatedData.title,
      subject: updatedData.subject ?? "All subjects",
      gender: updatedData.gender,
      location: updatedData.location,
      location_hint: updatedData.location_hint ?? "",
      lat: updatedData.lat,
      lon: updatedData.lon,
      no_of_students: updatedData.no_of_students,
      grade: updatedData.grade,
      salary: updatedData.salary,
      status: vacancy.status,
      time: updatedData.time,
      contact_number: updatedData.contact_number,
      salary_note: updatedData.salary_note ?? "",
      commission_charge: updatedData.commission_charge,
    };

    const res = await updateVacancyData(payload);
    if (!res.success) {
      toast.error(res.error || "Failed to update vacancy");
      // Throw so the dialog knows NOT to close
      throw new Error(res.error || "Failed to update vacancy");
    }

    toast.success("Vacancy updated");
    await queryClient.invalidateQueries({ queryKey: ["get-vacancy-by-id"] });
    await queryClient.invalidateQueries({ queryKey: ["get-all-vacancies"] });
    // Return without throwing → dialog will close
  };

  // ── Delete handler ──
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteVacancyById(vacancy.id); // adjust to your actual delete action
      if (!res.success) {
        toast.error(res.error || "Failed to delete vacancy");
        return;
      }
      toast.success("Vacancy deleted");
      setDeleteOpen(false);
      router.push("/vacancy");
    } catch {
      toast.error("Failed to delete vacancy");
    } finally {
      setIsDeleting(false);
    }
  };

  const message = buildWhatsAppMessage(vacancy, user);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Message copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="min-h-screen space-y-6 pb-10">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
              Vacancy #{vacancy.id.slice(0, 8)}
            </span>
            <StatusBadge status={vacancy.status} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{vacancy.title}</h1>
        </div>

        {/* ── Actions dropdown (Edit / Delete) ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Actions
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit dialog — controlled externally */}
      <EditVacancyDialog
        vacancy={vacancy}
        onUpdate={handleUpdateVacancy}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        vacancyTitle={vacancy.title}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {/* Vacancy Details | WhatsApp Message */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT: Vacancy Details */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              Vacancy Details
            </h2>
          </div>
          <div className="px-5 py-3">
            <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location" value={`${vacancy.location}${vacancy.location_hint ? ` — ${vacancy.location_hint}` : ""}`} />
            <DetailRow icon={<GraduationCap className="w-4 h-4" />} label="Class / Grade" value={vacancy.grade} />
            <DetailRow icon={<Clock className="w-4 h-4" />} label="Time" value={vacancy.time} />
            <DetailRow icon={<Users className="w-4 h-4" />} label="No. of Students" value={vacancy.no_of_students} />
            <DetailRow icon={<BookOpen className="w-4 h-4" />} label="Subject" value={vacancy.subject || "—"} />
            <DetailRow icon={<Wallet className="w-4 h-4" />} label="Salary" value={`NPR ${vacancy.salary.toLocaleString()}${vacancy.salary_note ? `  (${vacancy.salary_note})` : ""}`} />
            <DetailRow icon={<User className="w-4 h-4" />} label="Teacher Gender" value={vacancy.gender.charAt(0).toUpperCase() + vacancy.gender.slice(1)} />
            <DetailRow icon={<Phone className="w-4 h-4" />} label="Contact" value={vacancy.contact_number} />
            <DetailRow icon={<Wallet className="w-4 h-4" />} label="Commission" value={`${vacancy.commission_charge}%`} />
            <DetailRow icon={<Clock className="w-4 h-4" />} label="Created" value={new Date(vacancy.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
          </div>
          {Number.isFinite(vacancy.lat) && Number.isFinite(vacancy.lon) && (
            <div className="px-5 pb-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                <MapPin className="w-3 h-3" />
                {vacancy.lat.toFixed(5)}, {vacancy.lon.toFixed(5)}
              </span>
            </div>
          )}
        </div>

        {/* RIGHT: WhatsApp Message */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-border bg-emerald-500/5">
            <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              WhatsApp Message
              <span className="ml-auto">
                <Badge variant="secondary" className="text-[10px]">Ready to send</Badge>
              </span>
            </h2>
          </div>
          <div className="flex-1 p-4">
            <div className="rounded-xl bg-[#dcf8c6] dark:bg-emerald-900/30 border border-emerald-200/60 dark:border-emerald-700/30 p-4 relative">
              <div className="absolute -top-0 right-4 w-3 h-3 bg-[#dcf8c6] dark:bg-emerald-900/30 border-t border-r border-emerald-200/60 dark:border-emerald-700/30 rotate-[-45deg] translate-y-[-6px]" />
              <pre className="text-sm font-sans whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100 leading-relaxed">
                {message}
              </pre>
            </div>
          </div>
          <div className="px-4 pb-4">
            <Button onClick={handleCopy} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              {copied ? <><CheckCheck className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy Message</>}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground mt-2">Paste directly into WhatsApp or Messenger</p>
          </div>
        </div>
      </div>

      {/* Search Nearby Teachers */}
      <SearchPanel vacancy={vacancy} vacancyId={vacancyId} />
    </div>
  );
}