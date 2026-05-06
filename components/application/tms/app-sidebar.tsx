"use client";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Settings,
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
import { useEffect, useState } from "react";
import { ModeToggle } from "./toggle-mode";

export const AvailableRoutes = {
  DASHBOARD: "/dashboard",
  ADMIN_MANAGEMENT: "/admin-management",
  TEACHER_MANAGEMENT: "/teacher-management",
  VACANCY: "/vacancy",
  SETTINGS: "/settings",
};

export interface UserPropsTypes {
  id: string;
  name: string;
  email: string;
}

export const sidebarRoutes = [
  { title: "Dashboard", path: AvailableRoutes.DASHBOARD, icon: LayoutDashboard },
  { title: "Admin Management", path: AvailableRoutes.ADMIN_MANAGEMENT, icon: Users },
  { title: "Teacher Management", path: AvailableRoutes.TEACHER_MANAGEMENT, icon: GraduationCap },
  { title: "Vacancy", path: AvailableRoutes.VACANCY, icon: Briefcase },
  { title: "Settings", path: AvailableRoutes.SETTINGS, icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user: UserPropsTypes;
}

export function AppSidebar({ collapsed, onToggle, user }: AppSidebarProps) {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState<string>("");

  if (!user) return null;

  useEffect(() => {
    const matched = sidebarRoutes.find((r) => r.path === pathname);
    if (matched) setActiveItem(matched.title);
  }, [pathname]);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300",
          "bg-white/80 dark:bg-[#0b0b0c]/80 backdrop-blur-xl",
          "border-r border-black/5 dark:border-white/10",
          collapsed ? "w-[72px]" : "w-[252px]"
        )}
      >
        {/* Top subtle gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

        {/* Logo */}
        <div className={cn("border-b border-black/5 dark:border-white/10 px-5 py-5")}>
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center shadow-sm">
              <Image src="/tms/tms-logo.png" alt="Logo" fill className="object-contain p-1" />
            </div>

            {!collapsed && (
              <div>
                <h1 className="text-sm font-semibold tracking-tight">
                  GharMai Shikshya
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Teacher Management System
                </p>
              </div>
            )}
          </div>

          <div className={cn("mt-4", collapsed && "flex justify-center")}>
            <ModeToggle isCollapsed={collapsed} />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Navigation
            </p>
          )}

          {sidebarRoutes.map((route) => {
            const Icon = route.icon;
            const isActive = activeItem.includes(route.title);

            const link = (
              <Link
                href={route.path}
                onClick={() => setActiveItem(route.title)}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  "hover:scale-[1.02] hover:-translate-y-[1px]",
                  isActive
                    ? "bg-white/70 dark:bg-white/5 backdrop-blur border border-black/5 dark:border-white/10 text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                    : "text-sidebar-foreground/60 hover:bg-white/40 dark:hover:bg-white/5 hover:text-foreground"
                )}
              >
                {/* Active gradient bar */}
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all",
                    isActive
                      ? "h-5 bg-gradient-to-b from-blue-500 to-indigo-500"
                      : "h-0"
                  )}
                />

                {/* Icon */}
                <span
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-lg transition-all",
                    isActive
                      ? "bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400"
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
                  <TooltipContent side="right">
                    {route.title}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-black/5 dark:border-white/10 px-4 py-4">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <Avatar className="w-8 h-8 rounded-xl">
              <AvatarFallback className="bg-blue-500/20 text-blue-600 text-xs font-semibold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-semibold">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 shadow-md hover:bg-blue-500 hover:text-white transition"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  );
}