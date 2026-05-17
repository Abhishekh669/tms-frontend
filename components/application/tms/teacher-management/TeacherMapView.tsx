"use client";

/**
 * TeacherMapView
 * A full-width map dialog that:
 *  - Pins every teacher who has lat/long on a Leaflet map
 *  - Shows a collapsible sidebar list of all teachers
 *  - Clicking a pin OR a list item opens a detail panel for that teacher
 *  - Wide dialog (max-w-6xl) for comfortable viewing
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  X,
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Users,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Teacher, TeacherStatus } from "@/utils/types/teacher.types";

// Fix Leaflet default icon paths broken by webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Custom marker icons ───────────────────────────────────────────────────────

function makeIcon(color: string, selected = false) {
  const size = selected ? 36 : 28;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const VACANT_COLOR = "#f59e0b";
const DUTY_COLOR = "#10b981";
const SELECTED_COLOR = "#6366f1";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeacherMapViewProps {
  teachers: Teacher[];
  onClose: () => void;
}

// ── Status Badge (inline) ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TeacherStatus }) {
  return status === "on_duty" ? (
    <Badge className="gap-1 rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5">
      <CheckCircle2 className="w-2.5 h-2.5" />
      On Duty
    </Badge>
  ) : (
    <Badge className="gap-1 rounded-full bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-semibold px-2 py-0.5">
      <Clock className="w-2.5 h-2.5" />
      Vacant
    </Badge>
  );
}

// ── Link ──────────────────────────────────────────────────────────────────────

function DocLink({ href, label }: { href?: string | null; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline underline-offset-2"
    >
      <ExternalLink className="w-2.5 h-2.5" />
      {label}
    </a>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TeacherMapView({ teachers, onClose }: TeacherMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Teachers that have coordinates
  const mappedTeachers = teachers.filter(
    (t) => t.lat != null && t.long != null
  );

  const filteredSidebar = mappedTeachers.filter((t) =>
    t.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    t.location.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  // ── Select a teacher (from list or map click) ─────────────────────────────

  const selectTeacher = useCallback((teacher: Teacher) => {
    setSelectedTeacher((prev) => {
      // Reset previous marker icon
      if (prev) {
        const prevMarker = markersRef.current.get(prev.id);
        if (prevMarker) {
          prevMarker.setIcon(
            makeIcon(prev.status === "on_duty" ? DUTY_COLOR : VACANT_COLOR)
          );
        }
      }
      // Highlight new marker
      const marker = markersRef.current.get(teacher.id);
      if (marker) {
        marker.setIcon(makeIcon(SELECTED_COLOR, true));
        mapRef.current?.setView(
          [Number(teacher.lat), Number(teacher.long)],
          15,
          { animate: true }
        );
      }
      return teacher;
    });
  }, []);

  // ── Init map ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center on average of all mapped teachers, or Kathmandu
    let centerLat = 27.7172;
    let centerLng = 85.324;
    if (mappedTeachers.length > 0) {
      centerLat =
        mappedTeachers.reduce((s, t) => s + Number(t.lat), 0) /
        mappedTeachers.length;
      centerLng =
        mappedTeachers.reduce((s, t) => s + Number(t.long), 0) /
        mappedTeachers.length;
    }

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: mappedTeachers.length > 1 ? 12 : 14,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Place markers
    mappedTeachers.forEach((teacher) => {
      const color = teacher.status === "on_duty" ? DUTY_COLOR : VACANT_COLOR;
      const marker = L.marker([Number(teacher.lat), Number(teacher.long)], {
        icon: makeIcon(color),
      }).addTo(map);

      // Tooltip on hover
      marker.bindTooltip(
        `<div style="font-size:12px;font-weight:600;padding:2px 4px">${teacher.name}</div>`,
        { direction: "top", offset: [0, -8] }
      );

      marker.on("click", () => selectTeacher(teacher));
      markersRef.current.set(teacher.id, marker);
    });

    // Fit bounds if multiple markers
    if (mappedTeachers.length > 1) {
      const bounds = L.latLngBounds(
        mappedTeachers.map((t) => [Number(t.lat), Number(t.long)])
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const onDutyCount = mappedTeachers.filter((t) => t.status === "on_duty").length;
  const vacantCount = mappedTeachers.filter((t) => t.status === "vacant").length;

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground leading-tight">Teachers Map</h2>
            <p className="text-[11px] text-muted-foreground">
              {mappedTeachers.length} of {teachers.length} teachers have locations
            </p>
          </div>
          {/* Legend pills */}
          <div className="hidden sm:flex items-center gap-2 ml-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              On Duty ({onDutyCount})
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Vacant ({vacantCount})
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 rounded-xl p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* ── Body: map + sidebar ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Sidebar ── */}
        <div
          className={cn(
            "flex flex-col border-r border-border bg-card shrink-0 transition-all duration-300 overflow-hidden",
            sidebarOpen ? "w-64" : "w-0"
          )}
        >
          {/* Sidebar search */}
          <div className="px-3 py-2.5 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Filter teachers…"
                className="h-7 pl-8 text-xs rounded-lg bg-muted/50"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Teacher list */}
          <div className="flex-1 overflow-y-auto">
            {filteredSidebar.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-4">
                <Users className="w-6 h-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No teachers match</p>
              </div>
            ) : (
              filteredSidebar.map((teacher) => {
                const isSelected = selectedTeacher?.id === teacher.id;
                return (
                  <button
                    key={teacher.id}
                    onClick={() => selectTeacher(teacher)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 border-b border-border/50 transition-all hover:bg-muted/60 group",
                      isSelected && "bg-primary/5 border-l-2 border-l-primary"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
                          {teacher.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{teacher.location}</p>
                      </div>
                      <ChevronRight className={cn("w-3 h-3 shrink-0 transition-transform text-muted-foreground/40", isSelected && "text-primary translate-x-0.5")} />
                    </div>
                    <div className="mt-1.5 ml-9">
                      <StatusBadge status={teacher.status} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Map area ── */}
        <div className="relative flex-1 min-w-0">

          {/* Sidebar toggle tab */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="absolute top-3 left-3 z-[500] flex items-center gap-1.5 rounded-xl bg-card border border-border shadow-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Users className="w-3 h-3" />
            {sidebarOpen ? "Hide list" : `${mappedTeachers.length} teachers`}
          </button>

          {/* Leaflet map */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* ── Teacher detail card (bottom-right overlay) ── */}
          {selectedTeacher && (
            <div className="absolute bottom-4 right-4 z-[500] w-72 rounded-2xl bg-card border border-border shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
              {/* Card header */}
              <div
                className="px-4 py-3 flex items-start justify-between gap-2"
                style={{
                  background:
                    selectedTeacher.status === "on_duty"
                      ? "linear-gradient(135deg, #ecfdf5, #d1fae5)"
                      : "linear-gradient(135deg, #fffbeb, #fef3c7)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{
                      background:
                        selectedTeacher.status === "on_duty" ? DUTY_COLOR : VACANT_COLOR,
                    }}
                  >
                    {selectedTeacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {selectedTeacher.name}
                    </p>
                    <StatusBadge status={selectedTeacher.status} />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
              >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card body */}
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="break-all">{selectedTeacher.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {selectedTeacher.phone}
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <p>{selectedTeacher.location}</p>
                    {selectedTeacher.location_hint && (
                      <p className="text-[10px] opacity-70 mt-0.5">{selectedTeacher.location_hint}</p>
                    )}
                    {selectedTeacher.lat && selectedTeacher.long && (
                      <p className="text-[10px] font-mono opacity-50 mt-0.5">
                        {Number(selectedTeacher.lat).toFixed(5)}, {Number(selectedTeacher.long).toFixed(5)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <DocLink href={selectedTeacher.cv_link} label="CV" />
                  <DocLink href={selectedTeacher.transcript_link} label="Transcript" />
                  <DocLink href={selectedTeacher.addition_link} label="Additional" />
                </div>

                {/* Joined date */}
                <p className="text-[10px] text-muted-foreground/50">
                  Joined {new Date(selectedTeacher.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          )}

          {/* Empty state overlay */}
          {mappedTeachers.length === 0 && (
            <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
              <GraduationCap className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-foreground">No teachers have location data</p>
              <p className="text-xs text-muted-foreground">Add lat/long to teachers to see them on the map.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}