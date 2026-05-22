"use client";
import { ActiveVacancyCard } from "@/utils/types/report.types";
import { MapPin, Phone, Banknote, BookOpen, GraduationCap, AlertCircle } from "lucide-react";

interface Props {
  cards: ActiveVacancyCard[] | undefined;
  isLoading: boolean;
}

function paymentBadge(status: string) {
  switch (status) {
    case "completed": return { label: "Paid",    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" };
    case "partial":   return { label: "Partial", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" };
    default:          return { label: "Pending", cls: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" };
  }
}

function vacancyBadge(status: string) {
  switch (status) {
    case "ongoing":  return { label: "Ongoing",  cls: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400" };
    case "assigned": return { label: "Assigned", cls: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400" };
    default:         return { label: status,     cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" };
  }
}

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-3 space-y-2.5 min-w-[220px]">
      <div className="flex justify-between">
        <div className="h-3.5 w-20 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
        <div className="h-4 w-14 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full" />
      </div>
      <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
      <div className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-full" />
    </div>
  );
}

function VacancyCard({ card }: { card: ActiveVacancyCard }) {
  const paymentPct =
    card.amount_to_be_paid > 0
      ? Math.min(100, Math.round((card.payment_done / card.amount_to_be_paid) * 100))
      : 0;

  const vb = vacancyBadge(card.status);
  const pb = paymentBadge(card.payment_status);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-3 space-y-2 min-w-[220px] flex-shrink-0 w-[72vw] max-w-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[11px] font-bold font-mono text-zinc-600 dark:text-zinc-400 truncate">
          {card.code}
        </span>
        <div className="flex gap-1 shrink-0">
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${vb.cls}`}>
            {vb.label}
          </span>
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${pb.cls}`}>
            {pb.label}
          </span>
        </div>
      </div>

      {/* Subject + grade */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate">
          <BookOpen className="h-3 w-3 text-teal-500 shrink-0" />
          {card.subject}
        </span>
        <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">
          <GraduationCap className="h-3 w-3" />
          Gr.{card.grade}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1">
        <MapPin className="h-3 w-3 text-zinc-300 dark:text-zinc-600 shrink-0" />
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
          {card.location}{card.location_hint ? ` · ${card.location_hint}` : ""}
        </span>
      </div>

      {/* Salary + contact */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
          <Phone className="h-3 w-3 shrink-0" />
          {card.contact_number}
        </span>
        <span className="flex items-center gap-0.5 text-xs font-bold text-zinc-700 dark:text-zinc-200">
          <Banknote className="h-3 w-3 text-emerald-500 shrink-0" />
          Rs.{card.salary.toLocaleString()}
        </span>
      </div>

      {/* Payment bar */}
      <div className="space-y-1 pt-1 border-t border-zinc-50 dark:border-zinc-800">
        <div className="flex justify-between text-[9px] text-zinc-400 dark:text-zinc-500">
          <span>Payment</span>
          <span className="font-semibold text-zinc-500 dark:text-zinc-400">{paymentPct}%</span>
        </div>
        <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full"
            style={{ width: `${paymentPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px]">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Rs.{card.payment_done.toLocaleString()}
          </span>
          <span className="text-rose-500 dark:text-rose-400 font-semibold">
            Rs.{card.remaining_amount.toLocaleString()} due
          </span>
        </div>
      </div>
    </div>
  );
}

export function ActiveVacancyCards({ cards, isLoading }: Props) {
  return (
    <div className="space-y-2">
      <div className="px-4 flex items-center justify-between">
        <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Active Vacancies
        </p>
        <span className="text-[10px] text-zinc-300 dark:text-zinc-600">Latest 3</span>
      </div>

      {isLoading ? (
        <div className="flex gap-2.5 px-4 overflow-x-auto pb-1 no-scrollbar">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : !cards || cards.length === 0 ? (
        <div className="mx-4 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 p-6 flex flex-col items-center gap-1.5 text-center">
          <AlertCircle className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">No active vacancies</p>
        </div>
      ) : (
        <div className="flex gap-2.5 px-4 overflow-x-auto pb-1 no-scrollbar">
          {cards.map((card) => (
            <VacancyCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}