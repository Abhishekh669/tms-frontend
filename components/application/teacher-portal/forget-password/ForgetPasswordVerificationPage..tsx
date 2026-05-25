"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Key, Lock, Shield, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useGetForgetPasswordSession } from "@/utils/hooks/tanstack/teacher/use-get-forget-password-session";
import { checkForgetPasswordPin } from "@/utils/action/teacher/teacher.put";
import Image from "next/image";
import { logOutUser } from "@/utils/action/teacher/teacher.delete";

function ForgotPasswordVerificationPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const email       = searchParams.get("email");
  const token       = searchParams.get("token");

  const [pin, setPin]                             = useState("");
  const [newPassword, setNewPassword]             = useState("");
  const [confirmPassword, setConfirmPassword]     = useState("");
  const [showNewPassword, setShowNewPassword]     = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors]                       = useState({ pin: "", newPassword: "", confirmPassword: "" });
  const [isLoading, setIsLoading]                 = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  // ── Invalid params ────────────────────────────────────────────────────────
  if (!email || !token) {
    return (
      <PageShell>
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            Invalid reset link. Missing required parameters.
            <div className="mt-4">
              <Button onClick={() => router.replace("/teacher-login")} className="w-full bg-[#1A56DB] hover:bg-[#1648c0] text-white">
                Go to Login
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  const { data, isLoading: isSessionLoading, isError, error } = useGetForgetPasswordSession(email, token);

  useEffect(() => {
    if (!isSessionLoading && (isError || !data?.success)) {
      toast.error(data?.message || "Invalid or expired reset link");
      setRedirectCountdown(5);
      const timer = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); router.replace("/teacher-login"); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSessionLoading, isError, data, error, router]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isSessionLoading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-[#1A56DB] dark:text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Verifying Reset Link</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Please wait a moment…</p>
          <div className="w-6 h-6 border-2 border-[#1A56DB] border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  // ── Session error ─────────────────────────────────────────────────────────
  if (isError || !data?.success) {
    return (
      <PageShell>
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center justify-center mb-5">
          <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Link Expired</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 leading-relaxed">
          {data?.message || "This password reset link is invalid or has expired."}
        </p>
        {redirectCountdown > 0 && (
          <p className="text-xs text-red-500 dark:text-red-400 mb-5">
            Redirecting in {redirectCountdown}s…
          </p>
        )}
        <Button
          onClick={() => router.replace("/teacher-login")}
          className="w-full h-11 rounded-xl bg-[#1A56DB] hover:bg-[#1648c0] text-white font-semibold mb-3"
        >
          Go to Login
        </Button>
        <button
          onClick={() => router.push("/forgot-password")}
          className="w-full text-sm text-[#1A56DB] dark:text-blue-400 hover:underline font-medium"
        >
          Request a new reset link
        </button>
      </PageShell>
    );
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const validatePin = (v: string) => {
    if (!v) return "PIN is required.";
    if (v.length > 30) return "PIN must be 30 characters or less.";
    return "";
  };

  const validatePassword = (v: string) => {
    if (!v) return "Password is required.";
    if (v.length < 8) return "Minimum 8 characters.";
    if (v.length > 30) return "Maximum 30 characters.";
    if (!/^[A-Za-z0-9@_$]+$/.test(v)) return "Only letters, numbers, and @ _ $ allowed.";
    if (!/[A-Za-z]/.test(v)) return "Must contain at least one letter.";
    if (!/[0-9]/.test(v))    return "Must contain at least one number.";
    return "";
  };

  const validateConfirm = (v: string) => {
    if (!v) return "Please confirm your password.";
    if (v !== newPassword) return "Passwords do not match.";
    return "";
  };

  const getPasswordStrength = () => {
    if (!newPassword) return null;
    let s = 0;
    if (newPassword.length >= 8)  s++;
    if (newPassword.length >= 12) s++;
    if (/[A-Za-z]/.test(newPassword) && /[0-9]/.test(newPassword)) s++;
    if (/[@_$]/.test(newPassword)) s++;
    if (s <= 1) return { pct: 25,  label: "Weak",   bar: "bg-red-500",    text: "text-red-500 dark:text-red-400" };
    if (s <= 3) return { pct: 60,  label: "Medium",  bar: "bg-yellow-400", text: "text-yellow-600 dark:text-yellow-400" };
    return       { pct: 100, label: "Strong", bar: "bg-[#2E7D32]",  text: "text-[#2E7D32] dark:text-green-400" };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pe = validatePin(pin), pw = validatePassword(newPassword), pc = validateConfirm(confirmPassword);
    if (pe || pw || pc) { setErrors({ pin: pe, newPassword: pw, confirmPassword: pc }); return; }

    setIsLoading(true);
    try {
      const res = await checkForgetPasswordPin({ pin, token, email, new_password: newPassword });
      if (res.success) {
        await logOutUser("teacher_token")
        toast.success("Password reset! Redirecting to login…");
        setTimeout(() => router.replace("/teacher-login"), 2500);
      } else {
        toast.error(res.message || "Failed to reset password");
        if (res.message?.toLowerCase().includes("pin")) setPin("");
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <PageShell>
      {/* Icon + heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-[#1A56DB] dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-tight">
            Reset Password
          </h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
            Enter the PIN sent to <span className="font-medium text-[#1A56DB] dark:text-blue-400">{email}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* PIN */}
        <div className="space-y-1.5">
          <Label htmlFor="pin" className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Verification PIN
          </Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <Input
              id="pin"
              type="text"
              placeholder="Enter PIN from your email"
              value={pin}
              onChange={e => { const v = e.target.value.slice(0, 30); setPin(v); setErrors(err => ({ ...err, pin: validatePin(v) })); }}
              disabled={isLoading}
              maxLength={30}
              className={`pl-9 h-11 text-sm rounded-xl border transition-all
                bg-white dark:bg-white/5
                text-gray-900 dark:text-white
                placeholder:text-gray-400 dark:placeholder:text-gray-600
                disabled:opacity-50
                ${errors.pin
                  ? "border-red-300 dark:border-red-500/50 focus-visible:ring-red-200/40 bg-red-50 dark:bg-red-950/20"
                  : "border-gray-200 dark:border-white/10 focus-visible:ring-[#1A56DB]/20"
                }`}
            />
          </div>
          {errors.pin
            ? <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.pin}</p>
            : <p className="text-[11px] text-gray-400 dark:text-gray-600">Max 30 characters · Check your email inbox</p>
          }
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            New Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="Min. 8 chars, letters & numbers"
              value={newPassword}
              onChange={e => {
                const v = e.target.value.slice(0, 30);
                setNewPassword(v);
                setErrors(err => ({ ...err, newPassword: validatePassword(v), confirmPassword: confirmPassword ? validateConfirm(confirmPassword) : "" }));
              }}
              disabled={isLoading}
              maxLength={30}
              className={`pl-9 pr-10 h-11 text-sm rounded-xl border transition-all
                bg-white dark:bg-white/5
                text-gray-900 dark:text-white
                placeholder:text-gray-400 dark:placeholder:text-gray-600
                disabled:opacity-50
                ${errors.newPassword
                  ? "border-red-300 dark:border-red-500/50 focus-visible:ring-red-200/40 bg-red-50 dark:bg-red-950/20"
                  : "border-gray-200 dark:border-white/10 focus-visible:ring-[#1A56DB]/20"
                }`}
            />
            <button type="button" onClick={() => setShowNewPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength bar */}
          {strength && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 dark:text-gray-600">Strength</span>
                <span className={`text-[10px] font-semibold ${strength.text}`}>{strength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${strength.bar} rounded-full transition-all duration-300`} style={{ width: `${strength.pct}%` }} />
              </div>
            </div>
          )}

          {errors.newPassword
            ? <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.newPassword}</p>
            : (
              <div className="text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed space-y-0.5">
                <p>8–30 chars · letters + numbers · special: @ _ $</p>
              </div>
            )
          }
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-600 pointer-events-none" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={e => {
                const v = e.target.value.slice(0, 30);
                setConfirmPassword(v);
                setErrors(err => ({ ...err, confirmPassword: validateConfirm(v) }));
              }}
              disabled={isLoading}
              maxLength={30}
              className={`pl-9 pr-10 h-11 text-sm rounded-xl border transition-all
                bg-white dark:bg-white/5
                text-gray-900 dark:text-white
                placeholder:text-gray-400 dark:placeholder:text-gray-600
                disabled:opacity-50
                ${errors.confirmPassword
                  ? "border-red-300 dark:border-red-500/50 focus-visible:ring-red-200/40 bg-red-50 dark:bg-red-950/20"
                  : confirmPassword && !errors.confirmPassword
                    ? "border-green-300 dark:border-green-600/50 focus-visible:ring-green-200/40"
                    : "border-gray-200 dark:border-white/10 focus-visible:ring-[#1A56DB]/20"
                }`}
            />
            <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword
            ? <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</p>
            : confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-[#2E7D32] dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Passwords match!</p>
            )
          }
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl text-sm font-semibold transition-all
            bg-[#1A56DB] hover:bg-[#1648c0] active:bg-[#1240aa]
            dark:bg-[#1A56DB] dark:hover:bg-[#1648c0]
            text-white shadow-sm shadow-blue-200 dark:shadow-blue-950/50
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Resetting Password…
            </span>
          ) : "Reset Password"}
        </Button>

        {/* Back link */}
        <div className="text-center pt-1">
          <button type="button" onClick={() => router.push("/teacher-login")}
            className="text-xs font-medium text-[#1A56DB] dark:text-blue-400 hover:text-[#1240aa] dark:hover:text-blue-300 transition-colors flex items-center justify-center gap-1 mx-auto">
            <ArrowLeft className="w-3 h-3" /> Back to Login
          </button>
        </div>
      </form>

      {/* Didn't get PIN tip */}
      <div className="mt-5 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 flex items-start gap-2">
        <Key className="w-3.5 h-3.5 text-[#1A56DB] dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
          Didn't receive a PIN? Check your spam folder or{" "}
          <button onClick={() => router.push("/forgot-password")}
            className="font-semibold underline underline-offset-2 hover:text-[#1A56DB]">
            request a new one
          </button>.
        </p>
      </div>
    </PageShell>
  );
}

// ── Shared page wrapper ───────────────────────────────────────────────────────
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      min-h-screen flex flex-col
      bg-gradient-to-b from-[#EBF3FF] via-white to-[#F0F7EE]
      dark:from-[#060d1f] dark:via-[#090f1e] dark:to-[#071510]
      px-4 py-8 sm:py-0 sm:justify-center
    ">
      {/* Brand header */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-md border border-blue-100 dark:border-white/10 mb-3">
          <Image src="/tms-logo.png" alt="Ghar Mai Shikshya" width={64} height={64} className="w-full h-full object-cover" priority />
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A56DB] dark:text-blue-400">Ghar Mai Shikshya</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">Teacher Portal</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm mx-auto sm:max-w-md">
        <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/8 rounded-2xl shadow-xl dark:shadow-black/50 overflow-hidden">
          <div className="p-6 sm:p-8">{children}</div>

          {/* Security strip */}
          <div className="px-6 sm:px-8 py-2.5 border-t border-gray-100 dark:border-white/8 flex items-center justify-between bg-[#F5F9FF] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3 text-[#1A56DB] dark:text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-[10px] text-gray-400 dark:text-gray-600">Secured with end-to-end encryption</p>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-1 rounded-full bg-[#F5A623]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
              <span className="w-1 h-1 rounded-full bg-[#1A56DB]" />
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 dark:text-gray-700 mt-4">
          © {new Date().getFullYear()} Ghar Mai Shikshya · Teacher Portal
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordVerificationPage;