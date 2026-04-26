'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerAction } from '@/lib/actions/auth';
import { AshokaChakra } from '@/components/ui/ashoka-chakra';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition]    = useTransition();
  const [success, setSuccess]           = useState(false);
  const [role, setRole]                 = useState<'Citizen' | 'Official'>('Citizen');

  async function handleSubmit(formData: FormData) {
    formData.set('role', role);
    startTransition(async () => {
      const result = await registerAction(formData);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        setSuccess(true);
        toast.success(result.success);
      }
    });
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4">
        <div className="w-full max-w-sm text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500 mb-5" />
          <h2 className="font-heading text-2xl font-bold text-[#1A1A2E] mb-2">Account created!</h2>
          <p className="text-sm text-gray-500 mb-7">
            Please check your email to verify your account before signing in.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex w-full items-center justify-center h-11 bg-[#1B3A6B] text-white text-sm font-semibold rounded hover:bg-[#152e58] transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel — navy ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1B3A6B] flex-col justify-between p-12 relative overflow-hidden">
        {/* Diagonal CSS pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              white 0px,
              white 1px,
              transparent 1px,
              transparent 20px
            )`,
          }}
        />

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <AshokaChakra size={34} color="white" />
            <span className="text-white font-bold text-lg tracking-tight">GovTransparency</span>
          </div>
          <div className="flex h-[3px] w-16">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white/30" />
            <div className="flex-1 bg-[#138808]" />
          </div>
        </div>

        {/* Headline + bullets */}
        <div className="relative">
          <h2 className="font-heading text-4xl font-bold text-white leading-tight mb-8">
            Your voice.<br />
            Your government.<br />
            <span className="text-[#F59E0B]">Your rights.</span>
          </h2>

          <ul className="space-y-5">
            {[
              'Register once — track every complaint from submission to resolution',
              'Official responses are logged, timestamped, and publicly auditable',
              'Role-based access ensures the right people handle your case',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <span className="text-blue-100 text-sm leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer note */}
        <div className="relative">
          <p className="text-blue-300 text-xs">
            Secured by Government of India data protection standards.
            All sessions are encrypted and access is logged.
          </p>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-[#F9FAFB]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B3A6B] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <p className="text-sm text-gray-400">
            Have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-[#1B3A6B] hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Form centered */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-[#1A1A2E]">Create account</h1>
              <p className="mt-2 text-sm text-gray-500">Join the government transparency portal</p>
            </div>

            <form action={handleSubmit} className="space-y-5">
              {/* Full name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-[#1A1A2E]">Full Name</Label>
                <Input
                  id="name" name="name"
                  placeholder="Rajesh Kumar"
                  required
                  className="h-11 border-gray-300 rounded-md focus-visible:ring-[#1B3A6B] focus-visible:border-[#1B3A6B]"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-[#1A1A2E]">Email address</Label>
                <Input
                  id="email" name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="h-11 border-gray-300 rounded-md focus-visible:ring-[#1B3A6B] focus-visible:border-[#1B3A6B]"
                />
              </div>

              {/* Account type — radio */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1A1A2E]">Account Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: 'Citizen',  title: 'Citizen',  sub: 'File & track complaints' },
                    { value: 'Official', title: 'Official', sub: 'Review & manage cases' },
                  ] as const).map(opt => (
                    <label
                      key={opt.value}
                      className={`flex flex-col gap-0.5 rounded border-2 px-4 py-3 cursor-pointer transition-all ${
                        role === opt.value
                          ? 'border-[#1B3A6B] bg-[#EFF6FF]'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="roleRadio"
                        value={opt.value}
                        checked={role === opt.value}
                        onChange={() => setRole(opt.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold text-[#1A1A2E]">{opt.title}</span>
                      <span className="text-[11px] text-gray-400">{opt.sub}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-[#1A1A2E]">Password</Label>
                  <span className="text-xs text-gray-400">Min. 8 characters</span>
                </div>
                <div className="relative">
                  <Input
                    id="password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    className="h-11 border-gray-300 rounded-md pr-10 focus-visible:ring-[#1B3A6B] focus-visible:border-[#1B3A6B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#1A1A2E]">Confirm Password</Label>
                <Input
                  id="confirmPassword" name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-11 border-gray-300 rounded-md focus-visible:ring-[#1B3A6B] focus-visible:border-[#1B3A6B]"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-11 bg-[#1B3A6B] text-white text-sm font-semibold rounded hover:bg-[#152e58] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-gray-400">
              By registering you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
