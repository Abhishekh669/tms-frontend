"use client";

import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ModeToggle } from "../tms/toggle-mode";

// ─── Routes ───────────────────────────────────────────────────────────────────

export const TeacherAvailableRoutes = {
  DASHBOARD:       "/teacher-portal/dashboard",
  VACANCY_RECORDS: "/teacher-portal/vacancy-records",
  SETTINGS:        "/teacher-portal/settings",
};

export const teacherSidebarRoutes = [
  { title: "Dashboard",       path: TeacherAvailableRoutes.DASHBOARD,       icon: LayoutDashboard },
  { title: "Vacancy Records", path: TeacherAvailableRoutes.VACANCY_RECORDS, icon: ClipboardList   },
  { title: "Settings",        path: TeacherAvailableRoutes.SETTINGS,        icon: Settings        },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeacherPropsTypes {
  id: string;
  name: string;
  email: string;
}

interface TeacherSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user: TeacherPropsTypes;
}

// ─── Active-route helper ──────────────────────────────────────────────────────
const sortedRoutes = [...teacherSidebarRoutes].sort(
  (a, b) => b.path.length - a.path.length
);

function useActiveRoute(pathname: string) {
  return sortedRoutes.find(
    (r) => pathname === r.path || pathname.startsWith(r.path + "/")
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function TeacherSidebar({ collapsed, onToggle, user }: TeacherSidebarProps) {
  const pathname    = usePathname();
  const activeRoute = useActiveRoute(pathname);

  if (!user) return null;

  return (
    <TooltipProvider>
      {/* ── Mobile top header — visible only on mobile ── */}
      <MobileHeader />

      {/* ── Desktop sidebar — hidden on mobile ── */}
      <aside
        className={cn(
          "hidden md:flex",
          "fixed left-0 top-0 z-40 h-screen flex-col transition-all duration-300",
          "bg-white/80 dark:bg-[#0b0b0c]/80 backdrop-blur-xl",
          "border-r border-black/5 dark:border-white/10",
          collapsed ? "w-[72px]" : "w-[252px]"
        )}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        {/* Logo */}
        <div className="border-b border-black/5 dark:border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 shrink-0 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shadow-sm">
              <Image
                src="/tms/tms-logo.png"
                alt="GharMai Shikshya"
                fill
                className="object-contain p-1"
              />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-semibold tracking-tight truncate">
                  GharMai Shikshya
                </h1>
                <p className="text-[11px] text-muted-foreground">Teacher Portal</p>
              </div>
            )}
          </div>

          <div className={cn("mt-4", collapsed && "flex justify-center")}>
            <ModeToggle isCollapsed={collapsed} />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Navigation
            </p>
          )}

          {teacherSidebarRoutes.map((route) => {
            const Icon     = route.icon;
            const isActive = activeRoute?.path === route.path;

            const link = (
              <Link
                href={route.path}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  "hover:scale-[1.02] hover:-translate-y-[1px]",
                  isActive
                    ? "bg-white/70 dark:bg-white/5 backdrop-blur border border-black/5 dark:border-white/10 text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                    : "text-sidebar-foreground/60 hover:bg-white/40 dark:hover:bg-white/5 hover:text-foreground"
                )}
              >
                {/* Active vertical bar */}
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300",
                    isActive
                      ? "h-5 bg-gradient-to-b from-emerald-500 to-teal-500"
                      : "h-0"
                  )}
                />

                {/* Icon */}
                <span
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-lg transition-all shrink-0",
                    isActive
                      ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground group-hover:text-foreground group-hover:bg-white/50 dark:group-hover:bg-white/10"
                  )}
                >
                  <Icon className="w-[15px] h-[15px]" />
                </span>

                {!collapsed && (
                  <span className="text-[13px] font-medium tracking-tight truncate">
                    {route.title}
                  </span>
                )}
              </Link>
            );

            return (
              <Tooltip key={route.path}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">{route.title}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-black/5 dark:border-white/10 px-4 py-4">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <Avatar className="w-8 h-8 rounded-xl shrink-0">
              <AvatarFallback className="bg-emerald-500/20 text-emerald-600 text-xs font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 shadow-md hover:bg-emerald-500 hover:text-white transition"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </Button>
      </aside>

      {/* ── Mobile bottom tab bar — visible only on mobile ── */}
      <MobileTabBar activeRoute={activeRoute} />
    </TooltipProvider>
  );
}

// ─── Mobile Top Header ────────────────────────────────────────────────────────

function MobileHeader() {
  return (
    <header
      className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-50",
        "bg-white/95 dark:bg-[#0b0b0c]/95 backdrop-blur-xl",
        "border-b border-black/5 dark:border-white/10",
        "shadow-[0_4px_30px_rgba(0,0,0,0.06)]"
      )}
    >
      {/* Emerald accent line at bottom of header */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Logo */}
        <div className="relative w-8 h-8 shrink-0 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shadow-sm overflow-hidden">
          <Image
            src="/tms/tms-logo.png"
            alt="GharMai Shikshya"
            fill
            className="object-contain p-1"
          />
        </div>

        {/* App name */}
        <div className="min-w-0">
          <h1 className="text-sm font-semibold tracking-tight truncate leading-none">
            GharMai Shikshya
          </h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">Teacher Portal</p>
        </div>
      </div>
    </header>
  );
}

// ─── Mobile Tab Bar ───────────────────────────────────────────────────────────

function MobileTabBar({
  activeRoute,
}: {
  activeRoute: (typeof teacherSidebarRoutes)[number] | undefined;
}) {
  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50",
        "bg-white/95 dark:bg-[#0b0b0c]/95 backdrop-blur-xl",
        "border-t border-black/5 dark:border-white/10",
        "shadow-[0_-4px_30px_rgba(0,0,0,0.08)]"
      )}
    >
      {/* Emerald accent line at top of tab bar */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      {/* Tabs */}
      <nav className="flex items-stretch px-2 pt-1 pb-2">
        {teacherSidebarRoutes.map((route) => {
          const Icon     = route.icon;
          const isActive = activeRoute?.path === route.path;

          return (
            <Link
              key={route.path}
              href={route.path}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-1",
                "py-1.5 rounded-xl mx-0.5 transition-all duration-200",
                "active:scale-95",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              )}
            >
              {/* Top indicator pill */}
              <span
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-b-full transition-all duration-300",
                  isActive
                    ? "w-8 bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "w-0 opacity-0"
                )}
              />

              {/* Icon pill background */}
              <span
                className={cn(
                  "flex items-center justify-center w-11 h-8 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-emerald-500/10 dark:bg-emerald-500/15"
                    : "group-hover:bg-black/5 dark:group-hover:bg-white/5"
                )}
              >
                <Icon
                  className="transition-all duration-200"
                  style={{
                    width:  isActive ? 19 : 17,
                    height: isActive ? 19 : 17,
                  }}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </span>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] leading-none tracking-tight font-medium transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-55"
                )}
              >
                {route.title === "Vacancy Records" ? "Records" : route.title}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Safe-area padding for devices with a home indicator (iOS, etc.) */}
      <div className="pb-safe" />
    </div>
  );
}