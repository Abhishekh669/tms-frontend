"use client";

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { logOutUser } from '@/utils/action/teacher/teacher.delete';
import { checkChangePasswordPin } from '@/utils/action/teacher/teacher.put';
import { getErrorMessage } from '@/utils/helper/get.error.message';
import { useGetChangePasswordSession } from '@/utils/hooks/tanstack/teacher/use-get-change-password-session';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

function ChangePassword() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [reNewPass, setReNewPass] = useState('');
  const [pin, setPin] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showRe, setShowRe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Updated validation (letters, numbers, and only @ _ $) ──────────────────
  const validatePassword = (pass: string) => {
    if (!pass) return 'Password is required.';
    if (pass.length < 8) return 'Minimum 8 characters.';
    if (pass.length > 30) return 'Maximum 30 characters.';

    // Allowed: letters, numbers, and only @ _ $
    const allowedRegex = /^[A-Za-z0-9@_$]+$/;
    if (!allowedRegex.test(pass)) {
      return 'Only letters, numbers, and @ _ $ are allowed.';
    }
    if (!/[A-Za-z]/.test(pass)) return 'Must contain at least one letter.';
    if (!/[0-9]/.test(pass)) return 'Must contain at least one number.';

    return '';
  };

  const isPasswordValid = !validatePassword(newPassword);
  const passwordsMatch = isPasswordValid && reNewPass === newPassword && reNewPass.length > 0;
  const pinComplete = pin.length === 6;
  const canSubmit = isPasswordValid && passwordsMatch && pinComplete;

  if (!email || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-[#0a0f1a] dark:via-[#0d1321] dark:to-[#0a1628] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="dark:text-red-300">
              Invalid reset link. Missing required parameters.
              <div className="mt-4">
                <Button onClick={() => router.replace('/teacher-login')} className="w-full">
                  Go to Login
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePinChange = (value: string) => {
    // digits only, max 6
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setPin(cleaned);
  };

  const handleChangePassword = async () => {
    const newErrors: Record<string, string> = {};
    const passError = validatePassword(newPassword);
    if (passError) newErrors.newPassword = passError;
    if (!reNewPass) newErrors.reNewPass = 'Please confirm your password.';
    else if (newPassword !== reNewPass) newErrors.reNewPass = 'Passwords do not match.';
    if (pin.length !== 6) newErrors.pin = 'Please enter a 6-digit PIN.';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await checkChangePasswordPin({
        pin: pin.trim(),
        token: token.trim(),
        email: email.trim(),
        new_password: newPassword.trim(),
      });

      if (!res.success) {
        throw new Error(res?.error || 'Failed to change password');
      }
      await logOutUser('teacher_token');
      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.replace('/teacher-login');
      }, 3000);
    } catch (error: any) {
      console.error(error);
      toast.error(getErrorMessage(error) || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { data, isLoading: isSessionLoading, isError } = useGetChangePasswordSession(email, token);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-[#0a0f1a] dark:via-[#0d1321] dark:to-[#0a1628] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
          <div className="h-8 w-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          <p className="text-sm">Verifying your session…</p>
        </div>
      </div>
    );
  }

  // ── Session invalid / error ───────────────────────────────────────────────
  if (isError || !data?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-[#0a0f1a] dark:via-[#0d1321] dark:to-[#0a1628] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium dark:text-red-300">Session expired or invalid.</p>
              <p className="text-sm mt-1 text-red-600 dark:text-red-400">
                {data?.message ?? 'Please request a new password reset link.'}
              </p>
              <div className="mt-4">
                <Button onClick={() => router.replace('/teacher-login')} className="w-full">
                  Back to Login
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-[#0a0f1a] dark:via-[#0d1321] dark:to-[#0a1628] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-white/[0.03] rounded-2xl shadow-lg dark:shadow-black/40 border border-gray-100 dark:border-white/8 p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-blue-100 dark:bg-blue-950/60 p-3 rounded-full">
            <ShieldCheck className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Set New Password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a strong password and enter your PIN to confirm.
          </p>
        </div>

        {/* New Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> New Password
          </label>
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              placeholder="Min. 8 chars, letters, numbers & @ _ $"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`pr-10 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus-visible:ring-blue-500/30 ${
                errors.newPassword
                  ? 'border-red-400 dark:border-red-500/60 focus-visible:ring-red-300/30'
                  : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.newPassword}
            </p>
          )}
          {newPassword && isPasswordValid && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Password meets requirements
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Confirm Password
          </label>
          <div className="relative">
            <Input
              type={showRe ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={reNewPass}
              onChange={(e) => setReNewPass(e.target.value)}
              className={`pr-10 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus-visible:ring-blue-500/30 ${
                errors.reNewPass
                  ? 'border-red-400 dark:border-red-500/60 focus-visible:ring-red-300/30'
                  : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowRe((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showRe ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.reNewPass && (
            <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.reNewPass}
            </p>
          )}
          {passwordsMatch && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Passwords match!
            </p>
          )}
        </div>

        {/* 6-digit PIN — enabled only when passwords are valid & matching */}
        <div className="space-y-1.5">
          <label
            className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
              canSubmit || pinComplete
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-gray-400 dark:text-gray-600'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            6-Digit PIN
          </label>

          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              placeholder={passwordsMatch ? 'Enter your 6-digit PIN' : 'Fill passwords above first'}
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              maxLength={6}
              disabled={!passwordsMatch}
              className={`tracking-[0.35em] font-mono text-base
                bg-white dark:bg-white/5
                border-gray-200 dark:border-white/10
                text-gray-900 dark:text-white
                placeholder:tracking-normal placeholder:font-sans
                placeholder:text-gray-400 dark:placeholder:text-gray-600
                focus-visible:ring-blue-500/30
                disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-white/[0.02]
                transition-all
                ${errors.pin ? 'border-red-400 dark:border-red-500/60 focus-visible:ring-red-300/30' : ''}
                ${
                  pinComplete && passwordsMatch
                    ? 'border-green-400 dark:border-green-600/60 focus-visible:ring-green-300/30'
                    : ''
                }
              `}
            />
            {/* pip counter */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-[3px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
                    i < pin.length
                      ? pinComplete
                        ? 'bg-green-500 dark:bg-green-400'
                        : 'bg-blue-500 dark:bg-blue-400'
                      : 'bg-gray-200 dark:bg-white/15'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* helper texts */}
          {!passwordsMatch && (
            <p className="text-[11px] text-gray-400 dark:text-gray-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Set matching passwords above to unlock PIN entry.
            </p>
          )}
          {errors.pin && (
            <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.pin}
            </p>
          )}
          {pinComplete && passwordsMatch && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> PIN entered!
            </p>
          )}
          {passwordsMatch && !pinComplete && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500">Digits only · {pin.length}/6</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleChangePassword}
          disabled={!canSubmit || isSubmitting}
          className="w-full h-11 text-base font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Changing…
            </span>
          ) : (
            'Change Password'
          )}
        </Button>
      </div>
    </div>
  );
}

export default ChangePassword;