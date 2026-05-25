"use client";

import { logOutUser } from "@/utils/action/teacher/teacher.delete";
import { createChangePasswordSession } from "@/utils/action/teacher/teacher.post";
import { SafeTokenTeacherData } from "@/utils/types/teacher.types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ChangePasswordUI({ teacher }: { teacher: SafeTokenTeacherData }) {
  if (!teacher) return null;
  const router = useRouter();

  const [loading, setLoading] = useState<"change" | "forgot" | "logout" | null>(null);

  const handleChangePassword = async () => {
    if (loading) return;
    setLoading("change");
    try {
      const res = await createChangePasswordSession(teacher.email);
      if (!res.success || !res.token) {
        toast.error("Failed to create session");
        return;
      }
      
      window.location.href = `/teacher-change-password?token=${res.token}&email=${teacher?.email}`;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleForgotPassword = () => {
    if (loading) return;
    setLoading("forgot");
    window.location.href = "/teacher-forget-password";
  };

  const handleLogout = async () => {
    if (loading) return;
    setLoading("logout");
    try {
      const res = await logOutUser("teacher_token");
      if (!res) {
        toast.success("failed to logout ")
        return;
      }
      toast.success("Logged out successfully.");
      router.replace("/teacher-login")
    } catch {
      toast.error("Logout failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 dark:border-white/8 bg-card dark:bg-white/[0.03] overflow-hidden">

      {/* Section header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 dark:border-white/8">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
            <rect x="6" y="14" width="20" height="14" rx="4" fill="#C8873C" opacity="0.85" />
            <path d="M10 14V10a6 6 0 1 1 12 0v4" stroke="#C8873C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="16" cy="21" r="2" fill="white" opacity="0.9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            Account Security
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
            Change your password or recover account access
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-medium border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          Teacher Portal
        </span>
      </div>

      {/* Change Password row */}
      <button
        type="button"
        onClick={handleChangePassword}
        disabled={!!loading}
        className="group w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/40 dark:border-white/8 transition-colors duration-150 hover:bg-muted/30 dark:hover:bg-white/[0.03] active:bg-muted/50 disabled:opacity-60 disabled:cursor-not-allowed text-left"
      >
        <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#C8873C]/15 to-[#C8873C]/30 border border-[#C8873C]/25 flex-shrink-0 group-hover:from-[#C8873C]/20 group-hover:to-[#C8873C]/40 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8873C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1" fill="#C8873C" stroke="none" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground dark:text-white">Change Password</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Update your current password securely</p>
        </div>
        {loading === "change" ? (
          <svg className="w-4 h-4 animate-spin text-[#C8873C] flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-muted-foreground group-hover:text-[#C8873C] group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {/* Forgot Password row */}
      <button
        type="button"
        onClick={handleForgotPassword}
        disabled={!!loading}
        className="group w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/40 dark:border-white/8 transition-colors duration-150 hover:bg-muted/30 dark:hover:bg-white/[0.03] active:bg-muted/50 disabled:opacity-60 disabled:cursor-not-allowed text-left"
      >
        <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted/50 dark:bg-white/5 border border-border/50 dark:border-white/10 flex-shrink-0 group-hover:bg-muted/80 dark:group-hover:bg-white/10 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:text-foreground dark:group-hover:text-white transition-colors">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground dark:text-white">Forgot Password?</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Send a reset link to your email</p>
        </div>
        {loading === "forgot" ? (
          <svg className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {/* Logout row */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={!!loading}
        className="group w-full flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-red-50/60 dark:hover:bg-red-950/20 active:bg-red-50 dark:active:bg-red-950/30 disabled:opacity-60 disabled:cursor-not-allowed text-left"
      >
        <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 flex-shrink-0 group-hover:bg-red-100 dark:group-hover:bg-red-950/50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Log Out</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Sign out of your teacher account</p>
        </div>
        {loading === "logout" ? (
          <svg className="w-4 h-4 animate-spin text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-red-300 dark:text-red-700 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {/* Footer note */}
      <div className="px-4 py-2.5 border-t border-border/40 dark:border-white/8 flex items-center gap-2 bg-muted/20 dark:bg-white/[0.02]">
        <svg className="w-3 h-3 text-[#C8873C] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-[10px] text-muted-foreground">Secured with end-to-end encryption</p>
      </div>
    </div>
  );
}