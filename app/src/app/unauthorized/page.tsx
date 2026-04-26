import Link from 'next/link';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Unauthorized' };

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <ShieldX className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Access Denied</h1>
        <p className="mt-3 text-slate-500 max-w-sm">
          You don&apos;t have permission to access this page. Please contact an administrator
          if you believe this is an error.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild className="bg-[#1B3A6B] hover:bg-[#152e58]">
            <Link href="/auth/login">Sign In with Different Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
