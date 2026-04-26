'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfileAction, updatePasswordAction } from '@/lib/actions/auth';
import { toast } from 'sonner';
import type { User } from '@/types';

export function ProfileForm({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  function handleProfileSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result?.error) toast.error(result.error);
      else toast.success('Profile updated successfully.');
    });
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePasswordAction(formData);
      if (result?.error) toast.error(result.error);
      else {
        toast.success('Password changed successfully.');
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <div className="space-y-5">

      {/* Personal information */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#1A1A2E]">Personal Information</h2>
          <p className="text-xs text-gray-400 mt-0.5">Update your name and phone number</p>
        </div>
        <form action={handleProfileSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-[#1A1A2E]">Full Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user.name}
              required
              className="h-10 border-gray-300 text-sm focus-visible:ring-[#1B3A6B] focus-visible:border-[#1B3A6B]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-[#1A1A2E]">Email address</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="h-10 border-gray-200 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400">Email cannot be changed. Contact an administrator if needed.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium text-[#1A1A2E]">
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={(user as any).phone ?? ''}
              placeholder="+91 98765 43210"
              className="h-10 border-gray-300 text-sm focus-visible:ring-[#1B3A6B] focus-visible:border-[#1B3A6B]"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded bg-[#1B3A6B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#152e58] disabled:opacity-60 transition-colors"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#1A1A2E]">Change Password</h2>
          <p className="text-xs text-gray-400 mt-0.5">Must be at least 8 characters with one uppercase letter and one number</p>
        </div>
        <form onSubmit={handlePasswordSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-[#1A1A2E]">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                className="h-10 border-gray-300 text-sm pr-10 focus-visible:ring-[#1B3A6B] focus-visible:border-[#1B3A6B]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#1A1A2E]">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                required
                className="h-10 border-gray-300 text-sm pr-10 focus-visible:ring-[#1B3A6B] focus-visible:border-[#1B3A6B]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
