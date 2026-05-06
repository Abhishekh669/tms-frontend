"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  Briefcase,
  MessageCircle,
  X,
  ChevronDown,
  Pencil,
  Trash2,
  AlertTriangle,
  FileText,
  Mail,
  UserCheck,
  UserMinus,
  Loader2,
  Plus,
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
import {
  updateVacancyData,
  assignVacancyToTeacher,
  unAssignVacancyToTeacher,
  addPaymentDetails,
  updateVacancyPaymentDetails,
} from "@/utils/action/vacancy/vacancy.put";
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
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Types ────────────────────────────────────────────────────────────────────
type Teacher = ApiTeacher;
type SearchMode = "vacancy" | "custom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWhatsAppMessage(vacancy: VacancyTypeById, _user: UserType): string {
  const genderEmoji =
    vacancy.gender === "female"
      ? "👩‍🏫"
      : vacancy.gender === "male"
        ? "👨‍🏫"
        : "🧑‍🏫";

  return (
    `🏫 HOME TUITION REQUIREMENT 🏫\n\n` +
    `📌 Reference ID: ${vacancy.code}\n\n` +
    `📍 Location: ${vacancy.location}${vacancy.location_hint ? ` (${vacancy.location_hint})` : ""
    }\n` +
    `🎓 Class / Grade: ${vacancy.grade}\n` +
    `⏰ Preferred Time: ${vacancy.time}\n` +
    `👨‍🎓 Number of Students: ${vacancy.no_of_students}\n` +
    `📖 Subject: ${vacancy.subject || "—"}\n` +
    `💰 Salary: NPR ${vacancy.salary.toFixed(0)}\n` +
    `${genderEmoji} Gender Preference: ${vacancy.gender === "other" ? "Any" : vacancy.gender
    }\n\n` +
    `✨ Interested teachers, please reach out to:\n` +
    `📲 WhatsApp: 9741660035/9769289209\n` +
    `💼 Commission: ${vacancy.commission_charge}% of first month's salary\n` +
    `   ${vacancy.salary_note ? vacancy.salary_note : ""}`
  );
}


// ─── Update Payment Dialog ─────────────────────────────────────────────────

function UpdatePaymentDialog({
  open,
  onOpenChange,
  vacancy,
  onConfirm,
  isUpdating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancy: VacancyTypeById;
  onConfirm: (data: { payment_done: number; amount_to_be_paid: number; remaining_amount: number }) => void;
  isUpdating: boolean;
}) {
  const commissionAmount = (vacancy.salary * vacancy.commission_charge) / 100;

  const [paymentDone, setPaymentDone] = useState(vacancy.payment_done ?? 0);
  const [amountToBePaid, setAmountToBePaid] = useState(
    vacancy.amount_to_be_paid ?? commissionAmount
  );
  const [remainingAmount, setRemainingAmount] = useState(vacancy.remaining_amount ?? 0);

  useEffect(() => {
    if (open) {
      setPaymentDone(vacancy.payment_done ?? 0);
      setAmountToBePaid(vacancy.amount_to_be_paid ?? commissionAmount);
      setRemainingAmount(vacancy.remaining_amount ?? 0);
    }
  }, [open, vacancy, commissionAmount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Update payment
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Set exact payment values for this vacancy.
          </DialogDescription>
        </DialogHeader>

        {/* Salary / commission info */}
        <div className="rounded-xl bg-muted/50 border border-border p-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Salary</span>
            <span className="font-medium">NPR {vacancy.salary.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Commission rate</span>
            <span className="font-medium">{vacancy.commission_charge}%</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5">
            <span className="text-muted-foreground">Commission amount</span>
            <span className="font-semibold text-primary">NPR {commissionAmount.toLocaleString()}</span>
          </div>
          {vacancy.salary_note && (
            <p className="text-xs text-muted-foreground italic">{vacancy.salary_note}</p>
          )}
        </div>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Amount paid (NPR)
            </label>
            <Input
              type="number"
              min={0}
              value={paymentDone}
              onChange={(e) => setPaymentDone(Number(e.target.value))}
              placeholder="e.g. 2000"
            />
            <p className="text-[11px] text-muted-foreground">Total amount paid so far</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Amount to be paid (NPR)
            </label>
            <Input
              type="number"
              min={0}
              value={amountToBePaid}
              onChange={(e) => setAmountToBePaid(Number(e.target.value))}
              placeholder={`e.g. ${commissionAmount}`}
            />
            <p className="text-[11px] text-muted-foreground">
              Usually the commission — NPR {commissionAmount.toLocaleString()} ({vacancy.commission_charge}% of salary)
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Remaining amount (NPR)
            </label>
            <Input
              type="number"
              min={0}
              value={remainingAmount}
              onChange={(e) => setRemainingAmount(Number(e.target.value))}
              placeholder="Auto-calculated or manual"
            />
            <p className="text-[11px] text-muted-foreground">Can be manually overridden</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm({ payment_done: paymentDone, amount_to_be_paid: amountToBePaid, remaining_amount: remainingAmount })}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving…</>
            ) : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorMap[status] ?? "bg-muted text-muted-foreground border-border"
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
            <span className="font-semibold text-foreground">
              &quot;{vacancyTitle}&quot;
            </span>
            ? This action cannot be undone.
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
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete vacancy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Unassign Confirmation Dialog ─────────────────────────────────────────────

function UnassignConfirmDialog({
  open,
  onOpenChange,
  teacherName,
  onConfirm,
  isUnassigning,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherName: string;
  onConfirm: () => void;
  isUnassigning: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <UserMinus className="w-5 h-5" />
            Unassign Teacher
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-muted-foreground">
            Are you sure you want to unassign{" "}
            <span className="font-semibold text-foreground">{teacherName}</span>{" "}
            from this vacancy? The vacancy will return to{" "}
            <span className="font-semibold text-foreground">open</span> status.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUnassigning}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className="border-amber-500/40 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50"
            onClick={onConfirm}
            disabled={isUnassigning}
          >
            {isUnassigning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Unassigning…
              </>
            ) : (
              <>
                <UserMinus className="w-3.5 h-3.5 mr-1.5" />
                Unassign teacher
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Map Icons ────────────────────────────────────────────────────────────────

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

// ─── Map Component ────────────────────────────────────────────────────────────

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
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!Number.isFinite(tuitionLat) || !Number.isFinite(tuitionLon)) return;
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current).setView([tuitionLat, tuitionLon], 13);
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
      tuitionMarkerRef.current = L.marker([tuitionLat, tuitionLon], {
        icon: tuitionIcon,
      })
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

    if (!circleRef.current) {
      circleRef.current = L.circle([tuitionLat, tuitionLon], {
        radius: 5000,
        color: "#2563eb",
        weight: 2,
        opacity: 0.55,
        fillColor: "#3b82f6",
        fillOpacity: 0.06,
        dashArray: "8 5",
      }).addTo(map);
    } else {
      circleRef.current.setLatLng([tuitionLat, tuitionLon]);
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
            ${Number.isFinite(t.lat) && Number.isFinite(t.long)
            ? `<div style="color:#9ca3af;font-size:11px;margin-top:5px;">${t.lat.toFixed(5)}, ${t.long.toFixed(5)}</div>`
            : ""
          }
          </div>`,
          { maxWidth: 300 }
        );
    });

    const allPoints: L.LatLngExpression[] = [
      [tuitionLat, tuitionLon],
      ...validTeachers.map((t) => [t.lat, t.long] as L.LatLngExpression),
    ];

    if (validTeachers.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [48, 48] });
    } else {
      map.setView([tuitionLat, tuitionLon], 13);
    }
  }, [tuitionLat, tuitionLon, tuitionLabel, teachers]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      tuitionMarkerRef.current = null;
      teacherLayerRef.current = null;
      circleRef.current = null;
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 bg-muted/40 border-b border-border text-[11px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm inline-block" />
          Tuition location
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600 border-2 border-white shadow-sm inline-block" />
          Teacher location
        </span>
        <span className="flex items-center gap-1.5">
          <svg
            width="20"
            height="10"
            viewBox="0 0 20 10"
            className="inline-block flex-shrink-0"
          >
            <rect
              x="1"
              y="3"
              width="18"
              height="4"
              rx="2"
              fill="#3b82f620"
              stroke="#2563eb"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
          </svg>
          5 km radius
        </span>
        <span className="ml-auto">
          {(teachers ?? []).length} teacher
          {(teachers ?? []).length !== 1 ? "s" : ""} found
        </span>
      </div>
      <div
        ref={containerRef}
        className="bg-gray-50 dark:bg-slate-900 w-full h-[320px] md:h-[420px]"
      />
    </div>
  );
}

// ─── Search Panel ─────────────────────────────────────────────────────────────

interface SearchPanelProps {
  vacancy: VacancyTypeById;
  vacancyId: string;
  onAssignSuccess: () => Promise<void>;
}

function SearchPanel({ vacancy, vacancyId, onAssignSuccess }: SearchPanelProps) {
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
  const [request, setRequest] = useState<{
    lat?: number;
    lon?: number;
    location?: string;
  }>({});
  const [runSearch, setRunSearch] = useState(false);

  // Per-teacher assigning state: { [teacherId]: boolean }
  const [assigningIds, setAssigningIds] = useState<Record<string, boolean>>({});

  const nearbyQuery = useGetNearbyTeachers(
    vacancyId,
    request.lat,
    request.lon,
    request.location,
    { enabled: runSearch }
  );

  const searching = nearbyQuery.isFetching;

  // ── Assign teacher ──────────────────────────────────────────────────────────
  const handleAssignTuition = async (teacher: Teacher) => {
    setAssigningIds((prev) => ({ ...prev, [teacher.id]: true }));
    try {
      const res = await assignVacancyToTeacher({
        vacancy_id: vacancyId,
        teacher_id: teacher.id,
      });
      if (!res.success) {
        toast.error(res.error || "Failed to assign teacher");
        return;
      }
      toast.success(`${teacher.name} assigned to this vacancy`);
      await onAssignSuccess();
    } catch {
      toast.error("Failed to assign teacher");
    } finally {
      setAssigningIds((prev) => ({ ...prev, [teacher.id]: false }));
    }
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
          setSearchLocation(
            d.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          );
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
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            q
          )}&limit=6&addressdetails=0`
        );
        const list = (await res.json()) as Array<{
          display_name?: string;
          lat?: string;
          lon?: string;
        }>;
        setLocationOptions(
          list
            .map((x) => ({
              label: String(x.display_name ?? "").trim(),
              lat: Number(x.lat),
              lon: Number(x.lon),
            }))
            .filter(
              (x) =>
                x.label.length > 0 &&
                Number.isFinite(x.lat) &&
                Number.isFinite(x.lon)
            )
            .slice(0, 6)
        );
      } catch {
        setLocationOptions([]);
      } finally {
        setLocationPicking(false);
      }
    }, 350);
    return () => {
      if (locationDebounceRef.current)
        window.clearTimeout(locationDebounceRef.current);
    };
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

        if (
          Number.isFinite(latNum) &&
          Number.isFinite(lonNum) &&
          searchLat &&
          searchLon
        ) {
          lat = latNum;
          lon = lonNum;
          location = loc || undefined;
        } else if (loc) {
          const first = locationOptions[0];
          if (first) {
            lat = first.lat;
            lon = first.lon;
            location = first.label;
            setSearchLat(String(first.lat));
            setSearchLon(String(first.lon));
            setSearchLocation(first.label);
          } else {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                loc
              )}&limit=1`
            );
            const list = (await res.json()) as Array<{
              lat?: string;
              lon?: string;
              display_name?: string;
            }>;
            const item = list?.[0];
            const gLat = Number(item?.lat);
            const gLon = Number(item?.lon);
            if (Number.isFinite(gLat) && Number.isFinite(gLon)) {
              lat = gLat;
              lon = gLon;
              location = String(item?.display_name ?? loc);
              setSearchLat(String(gLat));
              setSearchLon(String(gLon));
              setSearchLocation(location);
            }
          }
        }
      }

      setRequest({ lat, lon, location });
      setRunSearch(true);
      const res = await nearbyQuery.refetch();
      const payload = res.data as unknown as { teachers?: unknown };
      setTeachers(
        Array.isArray(payload?.teachers) ? (payload.teachers as Teacher[]) : []
      );
      setSearched(true);
    } catch {
      toast.error("Failed to search teachers");
    }
  };

  const hasCustomCoords =
    searchLat !== "" &&
    searchLon !== "" &&
    Number.isFinite(Number(searchLat)) &&
    Number.isFinite(Number(searchLon));

  useEffect(() => {
    if (searchLocation.trim().length === 0) setLocationOptions([]);
  }, [searchLocation]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Search Nearby Teachers
          <Badge variant="outline" className="ml-auto text-[10px]">
            5 km radius
          </Badge>
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-2 p-1 rounded-xl bg-muted w-fit">
          <button
            onClick={() => {
              setMode("vacancy");
              setSearched(false);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === "vacancy"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <MapPin className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
            Vacancy location
          </button>
          <button
            onClick={() => {
              setMode("custom");
              setSearched(false);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === "custom"
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Navigation className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
            Custom location
          </button>
        </div>

        {mode === "vacancy" && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/15 text-sm text-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="font-medium truncate">{vacancy.location}</span>
            {vacancy.location_hint && (
              <span className="text-muted-foreground truncate">
                — {vacancy.location_hint}
              </span>
            )}
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
                  <button
                    onClick={() => setSearchLocation("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {searchLocation.trim().length >= 3 &&
                  (locationPicking || locationOptions.length > 0) && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                      {locationPicking && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          Searching locations…
                        </div>
                      )}
                      {!locationPicking &&
                        locationOptions.map((opt) => (
                          <button
                            key={`${opt.lat}-${opt.lon}-${opt.label}`}
                            type="button"
                            onClick={() => {
                              setSearchLocation(opt.label);
                              setSearchLat(String(opt.lat));
                              setSearchLon(String(opt.lon));
                              setLocationOptions([]);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors"
                          >
                            <div className="truncate">{opt.label}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {opt.lat.toFixed(5)}, {opt.lon.toFixed(5)}
                            </div>
                          </button>
                        ))}
                      {!locationPicking && locationOptions.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No matches.
                        </div>
                      )}
                    </div>
                  )}
              </div>
              <Input
                placeholder="Latitude"
                type="number"
                value={searchLat}
                onChange={(e) => setSearchLat(e.target.value)}
              />
              <Input
                placeholder="Longitude"
                type="number"
                value={searchLon}
                onChange={(e) => setSearchLon(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseVacancyLocation}
              >
                <MapPin className="w-3.5 h-3.5 mr-1.5" />
                Use vacancy location
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMyLocation}
                disabled={locating}
              >
                <Navigation className="w-3.5 h-3.5 mr-1.5" />
                {locating ? "Detecting…" : "My location"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPickerMap((v) => !v)}
              >
                <MapPin className="w-3.5 h-3.5 mr-1.5" />
                {showPickerMap ? "Close map" : "Pick on map"}
              </Button>
              {hasCustomCoords && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearCustomLocation}
                  className="text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            {hasCustomCoords && (
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[11px] font-normal">
                  <MapPin className="w-3 h-3 mr-1" />
                  {Number(searchLat).toFixed(5)}, {Number(searchLon).toFixed(5)}
                  {searchLocation &&
                    ` — ${searchLocation.slice(0, 60)}${searchLocation.length > 60 ? "…" : ""
                    }`}
                </Badge>
              </div>
            )}
            {showPickerMap && (
              <MapPicker
                initialLat={
                  searchLat && Number.isFinite(Number(searchLat))
                    ? Number(searchLat)
                    : undefined
                }
                initialLon={
                  searchLon && Number.isFinite(Number(searchLon))
                    ? Number(searchLon)
                    : undefined
                }
                onConfirm={handleMapConfirm}
                onClose={() => setShowPickerMap(false)}
              />
            )}
          </div>
        )}

        <Button
          onClick={handleSearch}
          disabled={searching}
          className="gap-1.5 w-full sm:w-auto"
        >
          <Search className="w-3.5 h-3.5" />
          {searching
            ? "Searching…"
            : mode === "vacancy"
              ? "Find teachers near vacancy"
              : "Find teachers near location"}
        </Button>

        {searched && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {teachers.length > 0
                  ? `${teachers.length} teacher${teachers.length !== 1 ? "s" : ""
                  } found nearby`
                  : "No teachers found nearby"}
              </p>
              {teachers.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  Sorted by distance
                </Badge>
              )}
            </div>

            {teachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <User className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">
                  No teachers found in this area
                </p>
                <p className="text-xs mt-1">
                  Try a different location or expand the search radius
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border overflow-hidden">
                  <TooltipProvider>
                    <div className="max-h-[420px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-background">
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="w-[220px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Name
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Contact
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Location
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Status
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Documents
                            </TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Coords
                            </TableHead>
                            <TableHead className="w-[160px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teachers.map((t) => {
                            const coords =
                              Number.isFinite(t.lat ?? NaN) &&
                                Number.isFinite(t.long ?? NaN)
                                ? `${(t.lat as number).toFixed(4)}, ${(
                                  t.long as number
                                ).toFixed(4)}`
                                : "—";
                            const isAssigning = assigningIds[t.id] ?? false;
                            const isAlreadyAssigned =
                              vacancy.assigned_to === t.id;

                            return (
                              <TableRow
                                key={t.id}
                                className={`border-border hover:bg-muted/40 transition-colors ${isAlreadyAssigned
                                  ? "bg-emerald-50/50 dark:bg-emerald-950/10"
                                  : ""
                                  }`}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold">
                                      {t.name?.charAt(0)?.toUpperCase() ?? "T"}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-foreground leading-tight truncate">
                                        {t.name}
                                        {isAlreadyAssigned && (
                                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                                            <UserCheck className="w-2.5 h-2.5" />
                                            Assigned
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground capitalize">
                                        {t.gender}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Phone className="w-3 h-3" />
                                    {t.phone}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-w-[180px] truncate cursor-default">
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        <span className="truncate">
                                          {t.location}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="rounded-xl text-xs max-w-[340px]">
                                      <p className="font-medium text-foreground">
                                        {t.location}
                                      </p>
                                      {t.location_hint && (
                                        <p className="text-muted-foreground">
                                          {t.location_hint}
                                        </p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="rounded-full text-[11px] font-semibold capitalize"
                                  >
                                    {t.status ?? "—"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {t.cv_link ? (
                                      <a
                                        href={t.cv_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-medium text-primary hover:underline underline-offset-2"
                                      >
                                        CV
                                      </a>
                                    ) : (
                                      <span className="text-xs text-muted-foreground/50 italic">
                                        —
                                      </span>
                                    )}
                                    {t.transcript_link && (
                                      <a
                                        href={t.transcript_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-medium text-primary hover:underline underline-offset-2"
                                      >
                                        Transcript
                                      </a>
                                    )}
                                    {t.addition_link && (
                                      <a
                                        href={t.addition_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-medium text-primary hover:underline underline-offset-2"
                                      >
                                        Additional
                                      </a>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-xs text-muted-foreground">
                                    {coords}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={isAssigning || isAlreadyAssigned}
                                    onClick={() => handleAssignTuition(t)}
                                    className={`rounded-xl gap-1.5 ${isAlreadyAssigned
                                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 cursor-default"
                                      : ""
                                      }`}
                                    variant={
                                      isAlreadyAssigned ? "ghost" : "default"
                                    }
                                  >
                                    {isAssigning ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Assigning…
                                      </>
                                    ) : isAlreadyAssigned ? (
                                      <>
                                        <UserCheck className="w-3 h-3" />
                                        Assigned
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="w-3 h-3" />
                                        Assign
                                      </>
                                    )}
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

                <NearbyTeachersMap
                  tuitionLat={Number(vacancy.lat)}
                  tuitionLon={Number(vacancy.lon)}
                  tuitionLabel={`${vacancy.location}${vacancy.location_hint ? ` — ${vacancy.location_hint}` : ""
                    }`}
                  teachers={teachers}
                />
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
  const [addPaymentAmount, setAddPaymentAmount] = useState<number | "">("");
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [updatePaymentOpen, setUpdatePaymentOpen] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [unassignOpen, setUnassignOpen] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);

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

  // ── Shared query invalidation ───────────────────────────────────────────────
  const invalidateVacancy = async () => {
    await queryClient.invalidateQueries({ queryKey: ["get-vacancy-by-id"] });
    await queryClient.invalidateQueries({ queryKey: ["get-all-vacancies"] });
  };

  const handleUpdateVacancy = async (
    updatedData: Parameters<
      React.ComponentProps<typeof EditVacancyDialog>["onUpdate"]
    >[0]
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
      throw new Error(res.error || "Failed to update vacancy");
    }

    toast.success("Vacancy updated");
    await invalidateVacancy();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteVacancyById(vacancy.id);
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

  // ── Unassign handler ────────────────────────────────────────────────────────
  const handleUnassign = async () => {
    setIsUnassigning(true);
    try {
      const res = await unAssignVacancyToTeacher({ vacancy_id: vacancy.id });
      if (!res.success) {
        toast.error(res.error || "Failed to unassign teacher");
        return;
      }
      toast.success("Teacher unassigned from this vacancy");
      setUnassignOpen(false);
      await invalidateVacancy();
    } catch {
      toast.error("Failed to unassign teacher");
    } finally {
      setIsUnassigning(false);
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

  const handleAddPayment = async () => {
    if (!addPaymentAmount || Number(addPaymentAmount) <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    setIsAddingPayment(true);
    try {
      const res = await addPaymentDetails({
        payment_id: vacancy.vacancy_id,
        payment_done: Number(addPaymentAmount),
      });
      if (!res.success) { toast.error(res.error || "Failed to add payment"); return; }
      toast.success("Payment added");
      setAddPaymentAmount("");
      await invalidateVacancy();
    } catch { toast.error("Failed to add payment"); }
    finally { setIsAddingPayment(false); }
  };

  const handleUpdatePayment = async (data: {
    payment_done: number;
    amount_to_be_paid: number;
    remaining_amount: number;
  }) => {
    setIsUpdatingPayment(true);
    try {
      const res = await updateVacancyPaymentDetails({
        payment_id: vacancy.vacancy_id,
        ...data,
      });
      if (!res.success) { toast.error(res.error || "Failed to update payment"); return; }
      toast.success("Payment updated");
      setUpdatePaymentOpen(false);
      await invalidateVacancy();
    } catch { toast.error("Failed to update payment"); }
    finally { setIsUpdatingPayment(false); }
  };

  const handleWhatsAppTeacher = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  const handleCallTeacher = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const hasAssignedTeacher = Boolean(vacancy.assigned_to);

  return (
    <div className="min-h-screen space-y-6 pb-10">
      {/* ── Page header ───────────────────────────────────────────────────── */}
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Actions
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Assign / Unassign depending on vacancy.assigned_to */}
            {hasAssignedTeacher ? (
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-500/10"
                onClick={() => setUnassignOpen(true)}
              >
                <UserMinus className="w-3.5 h-3.5" />
                Unassign teacher
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-500/10"
                // Scroll / focus the SearchPanel so the user can pick a teacher
                onClick={() => {
                  document
                    .getElementById("search-panel")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  toast.info("Search for a teacher below and click Assign");
                }}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Assign teacher
              </DropdownMenuItem>
            )}

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

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      <EditVacancyDialog
        vacancy={vacancy}
        onUpdate={handleUpdateVacancy}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        vacancyTitle={vacancy.title}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {vacancy.assigned_teacher && (
        <UpdatePaymentDialog
          open={updatePaymentOpen}
          onOpenChange={setUpdatePaymentOpen}
          vacancy={vacancy}
          onConfirm={handleUpdatePayment}
          isUpdating={isUpdatingPayment}
        />
      )}

      <UnassignConfirmDialog
        open={unassignOpen}
        onOpenChange={setUnassignOpen}
        teacherName={vacancy.assigned_teacher?.name ?? "this teacher"}
        onConfirm={handleUnassign}
        isUnassigning={isUnassigning}
      />

      {/* ── Assigned Teacher Section ──────────────────────────────────────── */}

      {/* ── Vacancy Details | WhatsApp Message ────────────────────────────── */}
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
            <DetailRow
              icon={<MapPin className="w-4 h-4" />}
              label="Location"
              value={`${vacancy.location}${vacancy.location_hint ? ` — ${vacancy.location_hint}` : ""
                }`}
            />
            <DetailRow
              icon={<GraduationCap className="w-4 h-4" />}
              label="Class / Grade"
              value={vacancy.grade}
            />
            <DetailRow
              icon={<Clock className="w-4 h-4" />}
              label="Time"
              value={vacancy.time}
            />
            <DetailRow
              icon={<Users className="w-4 h-4" />}
              label="No. of Students"
              value={vacancy.no_of_students}
            />
            <DetailRow
              icon={<BookOpen className="w-4 h-4" />}
              label="Subject"
              value={vacancy.subject || "—"}
            />
            <DetailRow
              icon={<Wallet className="w-4 h-4" />}
              label="Salary"
              value={`NPR ${vacancy.salary.toLocaleString()}${vacancy.salary_note ? `  (${vacancy.salary_note})` : ""
                }`}
            />
            <DetailRow
              icon={<User className="w-4 h-4" />}
              label="Teacher Gender"
              value={
                vacancy.gender.charAt(0).toUpperCase() + vacancy.gender.slice(1)
              }
            />
            <DetailRow
              icon={<Phone className="w-4 h-4" />}
              label="Contact"
              value={vacancy.contact_number}
            />
            <DetailRow
              icon={<Wallet className="w-4 h-4" />}
              label="Commission"
              value={`${vacancy.commission_charge}%`}
            />
            <DetailRow
              icon={<Clock className="w-4 h-4" />}
              label="Created"
              value={new Date(vacancy.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
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
                <Badge variant="secondary" className="text-[10px]">
                  Ready to send
                </Badge>
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
            <Button
              onClick={handleCopy}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Message
                </>
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground mt-2">
              Paste directly into WhatsApp or Messenger
            </p>
          </div>
        </div>
      </div>

      {vacancy.assigned_teacher && (
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 overflow-hidden shadow-md">
          <div className="px-5 py-4 border-b border-emerald-500/20 bg-emerald-500/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Assigned Teacher
              </h2>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Assigned
                </Badge>
                {/* Quick unassign button right in the header */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 gap-1.5 text-xs border-amber-400/40 text-amber-700 hover:bg-amber-50 hover:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-950/30"
                  onClick={() => setUnassignOpen(true)}
                >
                  <UserMinus className="w-3 h-3" />
                  Unassign
                </Button>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-white">
                    {vacancy.assigned_teacher.name?.charAt(0)?.toUpperCase() ??
                      "T"}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {vacancy.assigned_teacher.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {vacancy.assigned_teacher.gender}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${vacancy.assigned_teacher.status === "vacant"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        }`}
                    >
                      {vacancy.assigned_teacher.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Contact */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Contact Information
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-mono">
                        {vacancy.assigned_teacher.phone}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 gap-1 text-xs"
                        onClick={() =>
                          handleWhatsAppTeacher(vacancy.assigned_teacher!.phone)
                        }
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 gap-1 text-xs"
                        onClick={() =>
                          handleCallTeacher(vacancy.assigned_teacher!.phone)
                        }
                      >
                        <Phone className="w-3 h-3" />
                        Call
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs truncate">
                        {vacancy.assigned_teacher.email}
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Location
                    </p>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p>{vacancy.assigned_teacher.location}</p>
                        {vacancy.assigned_teacher.location_hint && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {vacancy.assigned_teacher.location_hint}
                          </p>
                        )}
                      </div>
                    </div>
                    {vacancy.assigned_teacher.lat &&
                      vacancy.assigned_teacher.long && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Navigation className="w-3 h-3" />
                          <span>
                            {vacancy.assigned_teacher.lat.toFixed(5)},{" "}
                            {vacancy.assigned_teacher.long.toFixed(5)}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Documents */}
                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Documents
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {vacancy.assigned_teacher.cv_link && (
                      <a
                        href={vacancy.assigned_teacher.cv_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        CV
                      </a>
                    )}
                    {vacancy.assigned_teacher.transcript_link && (
                      <a
                        href={vacancy.assigned_teacher.transcript_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                      >
                        <GraduationCap className="w-3 h-3" />
                        Transcript
                      </a>
                    )}
                    {vacancy.assigned_teacher.addition_link && (
                      <a
                        href={vacancy.assigned_teacher.addition_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        Additional
                      </a>
                    )}
                    {!vacancy.assigned_teacher.cv_link &&
                      !vacancy.assigned_teacher.transcript_link &&
                      !vacancy.assigned_teacher.addition_link && (
                        <span className="text-xs text-muted-foreground italic">
                          No documents uploaded
                        </span>
                      )}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="pt-4 border-t border-emerald-500/20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    Payment details
                    <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${vacancy.payment_status === "completed"
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                      : vacancy.payment_status === "partial"
                        ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
                        : vacancy.payment_status === "failed"
                          ? "bg-red-500/10 text-red-700 border-red-500/30"
                          : "bg-amber-500/10 text-amber-700 border-amber-500/30"
                      }`}>
                      {vacancy.payment_status}
                    </span>
                  </p>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Amount due</p>
                      <p className="text-base font-semibold text-foreground">NPR {vacancy.amount_to_be_paid.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-500/10 p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Paid</p>
                      <p className="text-base font-semibold text-emerald-700 dark:text-emerald-400">NPR {vacancy.payment_done.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-amber-500/10 p-3">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Remaining</p>
                      <p className="text-base font-semibold text-amber-700 dark:text-amber-400">NPR {vacancy.remaining_amount.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Add Payment input */}
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Add payment</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Enter amount to add (NPR)"
                      value={addPaymentAmount}
                      onChange={(e) => setAddPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleAddPayment}
                      disabled={isAddingPayment || !addPaymentAmount}
                      className="shrink-0 gap-1.5"
                    >
                      {isAddingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setUpdatePaymentOpen(true)}
                      className="shrink-0 gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Update
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    "Add" increments paid amount. "Update" lets you set all values precisely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── Search Nearby Teachers ─────────────────────────────────────────── */}
      {(!vacancy.assigned_to || vacancy.status === "open") && (
        <div id="search-panel">
          <SearchPanel
            vacancy={vacancy}
            vacancyId={vacancyId}
            onAssignSuccess={invalidateVacancy}
          />
        </div>
      )}

      {/* ── Already assigned notice ───────────────────────────────────────── */}
      {vacancy.assigned_to && vacancy.status !== "open" && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-foreground">
                  Teacher Already Assigned
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                This vacancy has been assigned to{" "}
                <strong className="text-foreground">
                  {vacancy.assigned_teacher?.name ?? "a teacher"}
                </strong>
                . Search for nearby teachers is disabled while a teacher is
                assigned.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 border-amber-400/40 text-amber-700 hover:bg-amber-50 hover:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-950/30"
              onClick={() => setUnassignOpen(true)}
            >
              <UserMinus className="w-3.5 h-3.5" />
              Unassign teacher
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}