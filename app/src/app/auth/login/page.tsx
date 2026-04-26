'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction } from '@/lib/actions/auth';
import { AshokaChakra } from '@/components/ui/ashoka-chakra';
import { toast } from 'sonner';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel — navy ───────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#1B3A6B] flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Top — logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <AshokaChakra size={36} color="white" />
            <span className="text-white font-bold text-lg tracking-tight">GovTransparency</span>
          </div>
          <div className="flex h-[3px] w-16 mt-3">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white/30" />
            <div className="flex-1 bg-[#138808]" />
          </div>
        </div>

        {/* Middle — headline + bullets */}
        <div className="relative">
          <h2 className="font-heading text-4xl font-bold text-white leading-tight mb-8">
            Accountability<br />starts with<br />
            <span className="text-[#F59E0B]">transparency.</span>
          </h2>

          <ul className="space-y-5">
            {[
              { text: 'Track every complaint from submission to resolution', },
              { text: 'Official responses are documented and publicly auditable', },
              { text: 'Secure role-based access for citizens, officials, and admins', },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <span className="text-blue-100 text-sm leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom — footer note */}
        <div className="relative">
          <p className="text-blue-300 text-xs">
            All sessions are encrypted and access is logged for security compliance.
          </p>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-[#F9FAFB]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B3A6B] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <p className="text-sm text-gray-400">
            No account?{' '}
            <Link href="/auth/register" className="font-semibold text-[#1B3A6B] hover:underline">
              Register
            </Link>
          </p>
        </div>

        {/* Form centered */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-[#1A1A2E]">Welcome back</h1>
              <p className="mt-2 text-sm text-gray-500">Sign in to your government portal account</p>
            </div>

            <form action={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-[#1A1A2E]">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="h-11 border-gray-300 rounded-md focus-visible:ring-[#1B3A6B] focus-visible:border-[#1B3A6B]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-[#1A1A2E]">
                    Password
                  </Label>
                  <span className="text-xs text-gray-400">Min. 8 characters</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
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

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-11 bg-[#1B3A6B] text-white text-sm font-semibold rounded hover:bg-[#152e58] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-800 mb-2">First time?</p>
              <p className="text-xs text-amber-700">
                Run the schema in your Supabase project, then{' '}
                <Link href="/auth/register" className="font-semibold underline">
                  register a new account
                </Link>
                . Set your role to Admin via the Supabase dashboard for full access.
              </p>
            </div> */}

            <p className="mt-8 text-center text-xs text-gray-400">
              Protected by government-grade encryption. All access is logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
