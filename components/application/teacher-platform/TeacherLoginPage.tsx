"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LogIn, Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/utils/helper/get.error.message";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { loginTeacher } from "@/utils/action/teacher/teacher.post";

function TeacherLoginCard() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const res = await loginTeacher(email, password);

      if (!res.success) {
        toast.error(getErrorMessage(res.error) || "Invalid credentials");
        return;
      }

      toast.success(res.message || "Logged in successfully");

      setTimeout(() => {
        router.replace("/teacher-portal/vacancy-records");
      }, 500);
    } catch (error) {
      toast.error(getErrorMessage(error) || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert("Forgot password clicked (dummy)");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  // ─── Same input class as teacher form ────────────────────────────────
  const inputCls =
    "h-11 sm:h-10 rounded-lg bg-background dark:bg-white/5 border-border/60 dark:border-white/10 text-foreground dark:text-white text-sm placeholder:text-muted-foreground/60 dark:placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:focus-visible:ring-blue-400 dark:focus-visible:border-blue-400 transition-colors";

  return (
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-[#0a0f1a] px-4 py-6">
      <Card className="w-full max-w-md shadow-lg border-border/60 dark:border-white/8 bg-card dark:bg-white/[0.03] rounded-2xl">
        <CardHeader className="space-y-5 pb-4 sm:pb-6">
          {/* ── Gharmai Siksha Logo ── */}
          <div className="flex justify-center">
            <Image
              src="/tms/tms-logo.png"
              alt="Gharmai Siksha"
              width={64}
              height={64}
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              priority
            />
          </div>

          <CardTitle className="text-center text-2xl sm:text-3xl font-extrabold text-foreground dark:text-white leading-tight tracking-tight">
            Teacher Login
          </CardTitle>

          <p className="text-center text-sm text-muted-foreground dark:text-white/40 leading-relaxed">
            Enter your credentials to access your dashboard.
          </p>
        </CardHeader>

        <CardContent className="space-y-5 sm:space-y-6 px-5 sm:px-6">
          {/* ── Email ── */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60 dark:text-white/50"
            >
              Email
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail className="w-4 h-4 text-muted-foreground/50 dark:text-white/20" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                onKeyDown={handleKeyPress}
                disabled={loading}
                className={cn(inputCls, "pl-10")}
                autoComplete="email"
                style={{ WebkitTapHighlightColor: "transparent" }}
              />
            </div>
          </div>

          {/* ── Password ── */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60 dark:text-white/50"
            >
              Password
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className="w-4 h-4 text-muted-foreground/50 dark:text-white/20" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={handleKeyPress}
                disabled={loading}
                className={cn(inputCls, "pl-10 pr-12")}
                autoComplete="current-password"
                style={{ WebkitTapHighlightColor: "transparent" }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-lg hover:bg-muted dark:hover:bg-white/5 touch-manipulation"
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{ WebkitTapHighlightColor: "transparent", minWidth: "44px", minHeight: "44px" }}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* ── Forgot password ── */}
          <div className="text-right">
            <Button
              onClick={handleForgotPassword}
              variant="link"
              disabled={loading}
              className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-0 h-auto py-0 font-medium touch-manipulation"
              style={{ WebkitTapHighlightColor: "transparent", minHeight: "44px" }}
            >
              Forgot password?
            </Button>
          </div>

          <Separator className="bg-border/60 dark:bg-white/8" />

          {/* ── Loading hint ── */}
          {loading && (
            <div className="flex items-start gap-2.5 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-xl text-xs border border-blue-200/60 dark:border-blue-800/40">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Verifying your credentials, please wait…</span>
            </div>
          )}

          {/* ── Login Button ── */}
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 sm:h-10 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 gap-2 transition-all touch-manipulation"
            style={{ WebkitTapHighlightColor: "transparent", minHeight: "44px" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging in…
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Login
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default TeacherLoginCard;