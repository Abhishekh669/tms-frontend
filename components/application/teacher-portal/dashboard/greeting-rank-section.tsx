"use client";
import { TeacherRank } from "@/utils/types/report.types";
import { SafeTokenTeacherData } from "@/utils/types/teacher.types";
import { Trophy } from "lucide-react";

interface Props {
  teacher: SafeTokenTeacherData;
  rankData: TeacherRank | undefined;
  isLoading: boolean;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function getRankSuffix(rank: number) {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
}

export function GreetingRankSection({ teacher, rankData, isLoading }: Props) {
  const firstName = teacher?.name?.split(" ")[0] ?? "Teacher";
  const initials  = getInitials(teacher?.name ?? "T");
  const isRanked  = rankData && rankData.rank > 0;

  return (
    <div className="px-4 pt-5 pb-1 flex items-center gap-3">
      {/* Avatar */}
      <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-white text-xs font-bold tracking-wide">{initials}</span>
      </div>

      {/* Name + greeting */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium leading-none mb-0.5">
          {getGreeting()}
        </p>
        <h1 className="text-base font-bold text-zinc-800 dark:text-zinc-100 leading-tight truncate">
          {firstName} 👋
        </h1>
      </div>

      {/* Rank chip */}
      {isLoading ? (
        <div className="h-9 w-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse shrink-0" />
      ) : isRanked ? (
        <div className="shrink-0 bg-teal-600 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-teal-100" />
          <div className="text-right leading-none">
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-bold text-white">{rankData.rank}</span>
              <span className="text-[10px] text-teal-200 font-medium">
                {getRankSuffix(rankData.rank)}
              </span>
            </div>
            <p className="text-[9px] text-teal-200 mt-0.5">of {rankData.total_teachers}</p>
          </div>
        </div>
      ) : (
        <div className="shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Unranked</p>
        </div>
      )}
    </div>
  );
}