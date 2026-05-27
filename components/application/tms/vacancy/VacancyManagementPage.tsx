"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  Plus,
  Eye,
  RefreshCw,
  MapPin,
  Navigation,
  Briefcase,
  CheckCircle2,
  Clock,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createVacancy } from "@/utils/action/vacancy/vacancy.post";
import { useGetAllVacancies } from "@/utils/hooks/tanstack/vacancy/use-get-vacancy-list";
import { CreateVacancy, PaymentStatus, VacancyQuery, VacancyStatus } from "@/utils/types/vacancy.types";
import { GenderType } from "@/utils/types/teacher.types";

const MapPicker = dynamic(() => import("@/components/application/teacher-form/MapPicker"), { ssr: false });
const DEFAULT_LIMIT = 20;

const vacancySchema = z.object({
  title: z.string().min(3),
  subject: z.string().min(1),
  location: z.string().min(3),
  location_hint: z.string().min(3),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  no_of_students: z.number().int().min(1),
  grade: z.string().min(1),
  salary: z.number().min(1),
  gender: z.enum(["male", "female", "other"]),
  status: z.enum(["open", "assigned", "completed", "ongoing", "cancelled"]),
  time: z.string().min(2),
  contact_number: z.string().min(7),
  salary_note: z.string().min(2),
  commission_charge: z.number().min(0).max(100),
});

type VacancyFormValues = z.infer<typeof vacancySchema>;

function StatusBadge({ status }: { status: VacancyStatus }) {
  return <Badge variant="outline">{status}</Badge>;
}

function GetGenderText(gender: GenderType) {
  switch (gender) {
    case "male":
      return "Male";
    case "female":
      return "Female";
    case "other":
      return "Any";
    default:
      return "Any"
  }
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant="secondary">{status}</Badge>;
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(circle at top right, ${accent}, transparent 70%)` }}
      />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${accent}18` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function AddVacancyDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationPicking, setLocationPicking] = useState(false);
  const [locationOptions, setLocationOptions] = useState<
    { label: string; lat: number; lon: number }[]
  >([]);
  const locationDebounceRef = useRef<number | null>(null);

  const form = useForm<VacancyFormValues>({
    resolver: zodResolver(vacancySchema),
    defaultValues: {
      title: "",
      subject: "",
      location: "",
      location_hint: "",
      lat: undefined,
      lon: undefined,
      no_of_students: undefined,
      grade: "",
      salary: undefined,
      gender: "male",
      status: "open",
      time: "",
      contact_number: "",
      salary_note: "",
      commission_charge: undefined,
    },
  });

  const lat = form.watch("lat");
  const lon = form.watch("lon");
  const locationVal = form.watch("location");
  const safeLat = Number.isFinite(lat) ? lat : undefined;
  const safeLon = Number.isFinite(lon) ? lon : undefined;

  // Location autocomplete (Nominatim) for create vacancy
  useEffect(() => {
    const q = String(locationVal ?? "").trim();
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
        const list = (await res.json()) as Array<{
          display_name?: string;
          lat?: string;
          lon?: string;
        }>;
        const options = list
          .map((x) => ({
            label: String(x.display_name ?? "").trim(),
            lat: Number(x.lat),
            lon: Number(x.lon),
          }))
          .filter((x) => x.label && Number.isFinite(x.lat) && Number.isFinite(x.lon))
          .slice(0, 6);
        setLocationOptions(options);
      } catch {
        setLocationOptions([]);
      } finally {
        setLocationPicking(false);
      }
    }, 350);

    return () => {
      if (locationDebounceRef.current) window.clearTimeout(locationDebounceRef.current);
    };
  }, [locationVal]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        form.setValue("lat", latitude, { shouldValidate: true });
        form.setValue("lon", longitude, { shouldValidate: true });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          form.setValue(
            "location",
            data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            { shouldValidate: true }
          );
        } catch {
          form.setValue("location", `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, { shouldValidate: true });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        toast.error("Could not get location: " + err.message);
      }
    );
  };

  const handleMapConfirm = useCallback(
    (nextLat: number, nextLon: number, address: string) => {
      form.setValue("lat", nextLat, { shouldValidate: true });
      form.setValue("lon", nextLon, { shouldValidate: true });
      // Always sync location text to selected address
      form.setValue("location", address, { shouldValidate: true });
      setShowMap(false);
      toast.success("Location selected");
    },
    [form]
  );

  const submit = async (values: VacancyFormValues) => {
    setSaving(true);
    const payload: CreateVacancy = values;
    const res = await createVacancy(payload);
    setSaving(false);
    if (!res.success) {
      toast.error(res.error || "Failed to create vacancy");
      return;
    }
    toast.success("Vacancy created");
    form.reset();
    setShowMap(false);
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Vacancy</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="grid grid-cols-2 gap-3">
          <Input placeholder="Title" {...form.register("title")} />
          <Input placeholder="Grade" {...form.register("grade")} />

          <Input className="col-span-2" placeholder="Subject(s) (e.g. Math, Science)" {...form.register("subject")} />

          <Controller
            name="location"
            control={form.control}
            render={({ field }) => (
              <div className="col-span-2 relative">
                <Input className="w-full" placeholder="Location" {...field} />

                {String(field.value ?? "").trim().length >= 3 &&
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
                              form.setValue("location", opt.label, { shouldValidate: true });
                              form.setValue("lat", opt.lat, { shouldValidate: true });
                              form.setValue("lon", opt.lon, { shouldValidate: true });
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
            )}
          />

          <Input className="col-span-2" placeholder="Location hint" {...form.register("location_hint")} />

          <div className="col-span-2 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleUseMyLocation} disabled={locating || saving}>
              <Navigation className="w-4 h-4 mr-1.5" />
              {locating ? "Detecting..." : "Use my location"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowMap((v) => !v)} disabled={saving}>
              <MapPin className="w-4 h-4 mr-1.5" />
              {showMap ? "Close map" : "Select from map"}
            </Button>
            {safeLat !== undefined && safeLon !== undefined && (
              <Badge variant="outline">
                {safeLat.toFixed(5)}, {safeLon.toFixed(5)}
                {locationVal ? ` - ${locationVal.slice(0, 50)}${locationVal.length > 50 ? "..." : ""}` : ""}
              </Badge>
            )}
          </div>

          {showMap && (
            <div className="col-span-2">
              <MapPicker
                initialLat={safeLat}
                initialLon={safeLon}
                onConfirm={handleMapConfirm}
                onClose={() => setShowMap(false)}
              />
            </div>
          )}

          <Controller
            name="lat"
            control={form.control}
            render={({ field }) => (
              <Input
                type="number"
                placeholder="Latitude"
                value={Number.isFinite(field.value) ? field.value : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? undefined : Number(v));
                }}
              />
            )}
          />
          <Controller
            name="lon"
            control={form.control}
            render={({ field }) => (
              <Input
                type="number"
                placeholder="Longitude"
                value={Number.isFinite(field.value) ? field.value : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? undefined : Number(v));
                }}
              />
            )}
          />
          <Input type="number" placeholder="Students" {...form.register("no_of_students", { valueAsNumber: true })} />
          <Input type="number" placeholder="Salary" {...form.register("salary", { valueAsNumber: true })} />
          <Select value={form.watch("gender")} onValueChange={(v) => form.setValue("gender", v as GenderType)}>
            <SelectTrigger>
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">male</SelectItem>
              <SelectItem value="female">female</SelectItem>
              <SelectItem value="other">any</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Time" {...form.register("time")} />
          <Input placeholder="Contact number" {...form.register("contact_number")} />
          <Input placeholder="Note" {...form.register("salary_note")} />
          <Input type="number" placeholder="Commission %" {...form.register("commission_charge", { valueAsNumber: true })} />

          <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as VacancyStatus)}>
            <SelectTrigger className="col-span-2">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">open</SelectItem>
              <SelectItem value="assigned">assigned</SelectItem>
              <SelectItem value="ongoing">ongoing</SelectItem>
              <SelectItem value="completed">completed</SelectItem>
              <SelectItem value="cancelled">cancelled</SelectItem>
            </SelectContent>
          </Select>

          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setShowMap(false);
                onOpenChange(false);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function VacancyManagementPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState<VacancyQuery>({ limit: DEFAULT_LIMIT, page: 0 });

  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [contactInput, setContactInput] = useState("");

  // Suggestions for the filter "Location" input (text only)
  const [filterLocationPicking, setFilterLocationPicking] = useState(false);
  const [filterLocationOptions, setFilterLocationOptions] = useState<string[]>([]);
  const filterLocationDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    const q = locationInput.trim();
    if (q.length < 3) {
      setFilterLocationOptions([]);
      return;
    }
    if (filterLocationDebounceRef.current) window.clearTimeout(filterLocationDebounceRef.current);
    filterLocationDebounceRef.current = window.setTimeout(async () => {
      try {
        setFilterLocationPicking(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=0`
        );
        const list = (await res.json()) as Array<{ display_name?: string }>;
        const options = list
          .map((x) => String(x.display_name ?? "").trim())
          .filter(Boolean)
          .slice(0, 6);
        setFilterLocationOptions(options);
      } catch {
        setFilterLocationOptions([]);
      } finally {
        setFilterLocationPicking(false);
      }
    }, 350);
    return () => {
      if (filterLocationDebounceRef.current) window.clearTimeout(filterLocationDebounceRef.current);
    };
  }, [locationInput]);
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [showFilterMap, setShowFilterMap] = useState(false);
  const [statusInput, setStatusInput] = useState<string>("all");
  const [paymentStatusInput, setPaymentStatusInput] = useState<string>("all");
  const [genderInput, setGenderInput] = useState<string>("all");

  const { data, isLoading, isError, isRefetching, refetch } = useGetAllVacancies(query);
  const vacanciesResponse = data?.vacanciesResponse;
  const vacancies = vacanciesResponse?.vacancies ?? [];
  const stats = vacanciesResponse?.vacancy_data;

  const total = vacanciesResponse?.total ?? 0;
  const limit = Number(query.limit ?? DEFAULT_LIMIT);
  const currentPage = Number(query.page ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const applySearch = () => {
    const latParsed = latInput.trim() === "" ? undefined : Number(latInput);
    const lonParsed = lonInput.trim() === "" ? undefined : Number(lonInput);
    const hasCoords = Number.isFinite(latParsed) && Number.isFinite(lonParsed);

    setQuery((prev) => ({
      ...prev,
      page: 0,
      search: searchInput.trim(),
      location: locationInput.trim(),
      contact_number: contactInput.trim(),
      status: statusInput === "all" ? "" : statusInput,
      payment_status: paymentStatusInput === "all" ? "" : paymentStatusInput,
      gender: genderInput === "all" ? "" : genderInput,
      ...(hasCoords ? { lat: latParsed, lon: lonParsed } : { lat: undefined, lon: undefined }),
    }));
  };

  const clearFilters = () => {
    setSearchInput("");
    setLocationInput("");
    setContactInput("");
    setLatInput("");
    setLonInput("");
    setStatusInput("all");
    setPaymentStatusInput("all");
    setGenderInput("all");
    setShowFilterMap(false);
    setQuery((prev) => ({
      ...prev,
      page: 0,
      search: "",
      location: "",
      contact_number: "",
      status: "",
      payment_status: "",
      gender: "",
      lat: undefined,
      lon: undefined,
    }));
  };

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(0, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  }, [currentPage, totalPages]);

  const handleFilterMapConfirm = useCallback((lat: number, lon: number, address: string) => {
    setLatInput(String(lat));
    setLonInput(String(lon));
    // Always sync location input to selected address
    setLocationInput(address);
    setShowFilterMap(false);
  }, []);

  return (
    <div className="min-h-screen space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Vacancy Management</h1>
          <p className="text-sm text-muted-foreground">Manage vacancies, payments, and location-based filtering.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Vacancy
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Total Vacancies" value={stats.total_vacancies} icon={<Briefcase className="w-5 h-5" />} accent="#6366f1" />
          <StatCard label="Open" value={stats.open_vacancies} icon={<CheckCircle2 className="w-5 h-5" />} accent="#10b981" />
          <StatCard label="Assigned" value={stats.assigned_vacancies} icon={<Clock className="w-5 h-5" />} accent="#f59e0b" />
          <StatCard label="Pending Payment" value={stats.pending_payments} icon={<Wallet className="w-5 h-5" />} accent="#3b82f6" />
          <StatCard label="Failed Payment" value={stats.failed_payments} icon={<AlertCircle className="w-5 h-5" />} accent="#ef4444" />
        </div>
      )}

      <div className="rounded-xl border p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <Input placeholder="Search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <div className="relative">
            <Input
              placeholder="Location"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
            />
            {locationInput.trim().length >= 3 &&
              (filterLocationPicking || filterLocationOptions.length > 0) && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                  {filterLocationPicking && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      Searching locations…
                    </div>
                  )}
                  {!filterLocationPicking &&
                    filterLocationOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setLocationInput(opt);
                          setFilterLocationOptions([]);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors truncate"
                        title={opt}
                      >
                        {opt}
                      </button>
                    ))}
                  {!filterLocationPicking && filterLocationOptions.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No matches.</div>
                  )}
                </div>
              )}
          </div>
          <Input placeholder="Contact number" value={contactInput} onChange={(e) => setContactInput(e.target.value)} />
          <Input placeholder="Lat (optional)" value={latInput} onChange={(e) => setLatInput(e.target.value)} />
          <Input placeholder="Lon (optional)" value={lonInput} onChange={(e) => setLonInput(e.target.value)} />
          <Select value={String(limit)} onValueChange={(v) => setQuery((p) => ({ ...p, limit: Number(v), page: 0 }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50].map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}/page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={statusInput} onValueChange={setStatusInput}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="open">open</SelectItem>
              <SelectItem value="assigned">assigned</SelectItem>
              <SelectItem value="ongoing">ongoing</SelectItem>
              <SelectItem value="completed">completed</SelectItem>
              <SelectItem value="cancelled">cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentStatusInput} onValueChange={setPaymentStatusInput}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payment</SelectItem>
              <SelectItem value="pending">pending</SelectItem>
              <SelectItem value="partial">partial</SelectItem>
              <SelectItem value="completed">completed</SelectItem>
              <SelectItem value="failed">failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={genderInput} onValueChange={setGenderInput}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All gender</SelectItem>
              <SelectItem value="male">male</SelectItem>
              <SelectItem value="female">female</SelectItem>
              <SelectItem value="other">other</SelectItem>
            </SelectContent>
          </Select>

          <Button type="button" variant="outline" onClick={() => setShowFilterMap((v) => !v)}>
            <MapPin className="w-4 h-4 mr-1.5" />
            {showFilterMap ? "Close map" : "Select from map"}
          </Button>

          <Button variant="outline" onClick={() => refetch()} disabled={isLoading || isRefetching} className="gap-1.5">
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button onClick={applySearch} disabled={isLoading || isRefetching} className="gap-1.5">
            <Search className="w-4 h-4" />
            Search
          </Button>

          <Button type="button" variant="outline" onClick={clearFilters} disabled={isLoading || isRefetching}>
            Clear Filters
          </Button>
        </div>

        {showFilterMap && (
          <MapPicker
            initialLat={latInput && Number.isFinite(Number(latInput)) ? Number(latInput) : undefined}
            initialLon={lonInput && Number.isFinite(Number(lonInput)) ? Number(lonInput) : undefined}
            onConfirm={handleFilterMapConfirm}
            onClose={() => setShowFilterMap(false)}
          />
        )}
      </div>

      <div className="rounded-xl border overflow-hidden">
        {isError ? (
          <div className="p-8 text-center text-sm">Failed to load vacancies.</div>
        ) : isLoading ? (
          <div className="p-8 text-center text-sm">Loading...</div>
        ) : vacancies.length === 0 ? (
          <div className="p-8 text-center text-sm">No vacancies found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vacancies.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{v.code}</TableCell>
                  <TableCell className="font-medium">{v.title}</TableCell>
                  <TableCell>
                    <div className="max-w-[160px] truncate" title={v.subject}>
                      {v.subject || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[220px] truncate" title={`${v.location} - ${v.location_hint}`}>
                      {v.location}
                    </div>
                  </TableCell>
                  <TableCell>{v.grade}</TableCell>
                  <TableCell>{GetGenderText(v.gender)}</TableCell>
                  <TableCell>{v.no_of_students}</TableCell>
                  <TableCell>NPR {v.salary}</TableCell>
                  <TableCell>
                    <StatusBadge status={v.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={v.payment_status} />
                  </TableCell>
                  <TableCell>NPR {v.amount_to_be_paid}</TableCell>
                  <TableCell>{v.contact_number}</TableCell>
                  <TableCell>{new Date(v.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Link href={`/vacancy/${v.id}`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages} · {total} total (0-based page/offset in API)
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setQuery((p) => ({ ...p, page: currentPage - 1 }))}
            >
              Prev
            </Button>
            {visiblePages.map((p) => (
              <Button
                key={p}
                size="sm"
                variant={p === currentPage ? "default" : "outline"}
                onClick={() => setQuery((q) => ({ ...q, page: p }))}
              >
                {p + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setQuery((p) => ({ ...p, page: currentPage + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AddVacancyDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={() => refetch()} />
    </div>
  );
}
