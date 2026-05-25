"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, ArrowRight, CheckCircle2, Loader2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { createForgetPassword } from "@/utils/action/teacher/teacher.post";
import Image from "next/image";
import Link from "next/link";
import { SafeTokenTeacherData } from "@/utils/types/teacher.types";

const COOLDOWN_SECONDS = 60;
const STORAGE_KEY = "forgot_pw_cooldown_until";

function getRemainingSeconds(): number {
  try {
    const until = localStorage.getItem(STORAGE_KEY);
    if (!until) return 0;
    const remaining = Math.ceil((parseInt(until) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

function setCooldown() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + COOLDOWN_SECONDS * 1000));
  } catch {}
}

function clearCooldown() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function ForgotPasswordPage({teacher} : {teacher ?: SafeTokenTeacherData}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldownState] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const remaining = getRemainingSeconds();
    if (remaining > 0) {
      setSent(true);
      setCooldownState(remaining);
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      const remaining = getRemainingSeconds();
      setCooldownState(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        clearCooldown();
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const validate = (val: string) => {
    if (!val) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Enter a valid email address.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(email);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await createForgetPassword(email.trim());
      if (res.success && res.token) {
        setCooldown();
        setCooldownState(COOLDOWN_SECONDS);
        setSent(true);
        setTimeout(() => {
          router.push(`/teacher-forget-password/verification?email=${email}&token=${res.token}`);
        }, 1000);
      } else {
        setError(res.message || "Failed to create forget password session");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    if (cooldown > 0) return;
    setSent(false);
    setEmail("");
    clearCooldown();
  };

  const progressPercent = Math.round((cooldown / COOLDOWN_SECONDS) * 100);

  return (
    <div
      className="
      min-h-screen flex flex-col
      bg-gradient-to-b from-[#EBF3FF] via-white to-[#F0F7EE]
      dark:from-[#060d1f] dark:via-[#090f1e] dark:to-[#071510]
      px-4 py-8 sm:py-0 sm:justify-center
    "
    >
      {/* ── Brand header — visible on all sizes ── */}
      <div className="flex flex-col items-center mb-6 sm:mb-8">
        <div
          className="
          w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden
          shadow-md border border-blue-100 dark:border-white/10
          mb-3
        "
        >
          <Image
            src="/tms/tms-logo.png"
            alt="Ghar Mai Shikshya"
            width={80}
            height={80}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A56DB] dark:text-blue-400">
          Ghar Mai Shikshya
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">Teacher Portal</p>
      </div>

      {/* ── Card ── */}
      <div className="w-full max-w-sm mx-auto sm:max-w-md">
        <div
          className="
          bg-white dark:bg-white/[0.03]
          border border-gray-100 dark:border-white/8
          rounded-2xl shadow-xl dark:shadow-black/50
          overflow-hidden
        "
        >
          {!sent ? (
            /* ──────────── FORM STATE ──────────── */
            <div className="p-6 sm:p-8">
              {/* Icon + heading */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="
                  w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  bg-blue-50 dark:bg-blue-950/40
                  border border-blue-200 dark:border-blue-800/50
                "
                >
                  <Mail className="w-4 h-4 text-[#1A56DB] dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                    Forgot your password?
                  </h1>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    We'll send a reset link to your email.
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest"
                  >
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-600 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      disabled={loading}
                      className={`
                        pl-9 h-11 text-sm rounded-xl border transition-all
                        bg-white dark:bg-white/5
                        text-gray-900 dark:text-white
                        placeholder:text-gray-400 dark:placeholder:text-gray-600
                        disabled:opacity-50
                        ${
                          error
                            ? "border-red-300 dark:border-red-500/50 focus-visible:ring-red-200/40 bg-red-50 dark:bg-red-950/20"
                            : "border-gray-200 dark:border-white/10 focus-visible:ring-[#1A56DB]/20"
                        }
                      `}
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0 inline-block" />
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full h-11 text-sm font-semibold rounded-xl transition-all
                    bg-[#1A56DB] hover:bg-[#1648c0] active:bg-[#1240aa]
                    dark:bg-[#1A56DB] dark:hover:bg-[#1648c0]
                    text-white shadow-sm shadow-blue-200 dark:shadow-blue-950/50
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending link…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Send Reset Link
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Footer link */}
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/8 flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-gray-600">Remember it?</p>
                <Link
                  href={`${teacher ?  "teacher-portal/settings" : "teacher-login"}`}
                  className="text-xs font-semibold text-[#1A56DB] dark:text-blue-400 hover:text-[#1240aa] dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  Back to {teacher ? "settings" : "login"}<ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            /* ──────────── SENT STATE ──────────── */
            <div className="p-6 sm:p-8">
              {/* Icon + heading */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="
                  w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  bg-green-50 dark:bg-green-950/40
                  border border-green-200 dark:border-green-800/50
                "
                >
                  <CheckCircle2 className="w-5 h-5 text-[#2E7D32] dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                    Check your inbox
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Reset link sent successfully.
                  </p>
                </div>
              </div>

              {/* Email pill */}
              <div
                className="
                flex items-center gap-2 px-3 py-2.5 mb-5
                rounded-xl bg-blue-50 dark:bg-blue-950/30
                border border-blue-200 dark:border-blue-800/40
              "
              >
                <Mail className="w-3.5 h-3.5 text-[#1A56DB] dark:text-blue-400 flex-shrink-0" />
                <span className="text-sm font-medium text-[#1A56DB] dark:text-blue-300 truncate">
                  {email}
                </span>
              </div>

              {/* Progress bar — above the button so cooldown feels attached */}
              {cooldown > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Cooldown
                    </span>
                    <span className="text-[10px] font-mono text-[#1A56DB] dark:text-blue-400">
                      {cooldown}s
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1A56DB] dark:bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Resend button */}
              <Button
                onClick={handleTryAgain}
                disabled={cooldown > 0}
                variant="outline"
                className="
                  w-full h-11 text-sm rounded-xl
                  border border-gray-200 dark:border-white/10
                  bg-white dark:bg-white/5
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-white/10
                  hover:border-[#1A56DB]/40 dark:hover:border-blue-500/40
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all
                "
              >
                {cooldown > 0 ? (
                  <span className="flex items-center justify-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Resend in {cooldown}s
                  </span>
                ) : (
                  "Didn't get it? Try again"
                )}
              </Button>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/8 flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-gray-600">Wrong email?</p>
                <button
                  onClick={handleTryAgain}
                  disabled={cooldown > 0}
                  className="text-xs font-semibold text-[#1A56DB] dark:text-blue-400 hover:text-[#1240aa] dark:hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  Use a different one <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* ── Security strip ── */}
          <div
            className="
            px-6 sm:px-8 py-2.5
            border-t border-gray-100 dark:border-white/8
            flex items-center justify-between
            bg-[#F5F9FF] dark:bg-white/[0.02]
          "
          >
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3 text-[#1A56DB] dark:text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-[10px] text-gray-400 dark:text-gray-600">Secured with end-to-end encryption</p>
            </div>
            {/* Sun accent matching logo */}
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-1 rounded-full bg-[#F5A623]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
              <span className="w-1 h-1 rounded-full bg-[#1A56DB]" />
            </div>
          </div>
        </div>

        {/* Below-card note */}
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-700 mt-4">
          © {new Date().getFullYear()} Ghar Mai Shikshya · Teacher Portal
        </p>
      </div>
    </div>
  );
}