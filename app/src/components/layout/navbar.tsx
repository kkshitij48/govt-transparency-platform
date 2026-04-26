'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { logoutAction } from '@/lib/actions/auth';
import { AshokaChakra } from '@/components/ui/ashoka-chakra';
import type { User as UserType } from '@/types';

interface NavbarProps {
  user?: UserType | null;
}

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/departments', label: 'Departments' },
  { href: '/projects', label: 'Projects' },
];

const dashboardLinks: Record<string, string> = {
  Admin: '/admin/dashboard',
  Official: '/official/dashboard',
  Citizen: '/citizen/dashboard',
};

const roleColors: Record<string, string> = {
  Admin: 'text-red-600',
  Official: 'text-[#1B3A6B]',
  Citizen: 'text-emerald-600',
};

export function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <AshokaChakra size={30} />
            <div>
              <p className="text-sm font-bold leading-none text-[#1A1A2E] tracking-tight">
                GovTransparency
              </p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5 tracking-wide uppercase">
                Accountability Portal
              </p>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex md:items-center md:gap-8">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm font-medium text-gray-600 transition-colors hover:text-[#1A1A2E] group"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-[#F59E0B] transition-all duration-200 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-gray-50">
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarFallback className="bg-[#1B3A6B] text-xs font-semibold text-white">
                        {user.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left sm:block">
                      <p className="text-xs font-semibold leading-none text-[#1A1A2E]">{user.name}</p>
                      <p className={`text-[10px] mt-0.5 font-medium ${roleColors[user.role]}`}>{user.role}</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium text-[#1A1A2E]">{user.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={dashboardLinks[user.role]} className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 text-gray-400" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4 text-gray-400" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={() => logoutAction()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-[#1B3A6B] border border-[#1B3A6B] rounded hover:bg-[#1B3A6B] hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1B3A6B] rounded hover:bg-[#152e58] transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium text-gray-700 hover:text-[#1B3A6B]"
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
                <Link
                  href="/auth/login"
                  className="flex-1 py-2 text-center text-sm font-medium text-[#1B3A6B] border border-[#1B3A6B] rounded"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="flex-1 py-2 text-center text-sm font-medium text-white bg-[#1B3A6B] rounded"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
