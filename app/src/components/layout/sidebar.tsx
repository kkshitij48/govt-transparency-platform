'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, PlusCircle, Users, Building2,
  FolderOpen, BarChart3, LogOut, MessageSquare, AlertCircle,
  ChevronRight, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/lib/actions/auth';
import { AshokaChakra } from '@/components/ui/ashoka-chakra';
import type { User } from '@/types';

interface SidebarProps {
  user: User;
}

const citizenNav = [
  { href: '/citizen/dashboard',        label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/citizen/complaints',       label: 'My Complaints',   icon: FileText },
  { href: '/citizen/complaints/new',   label: 'File Complaint',  icon: PlusCircle },
];

const officialNav = [
  { href: '/official/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/official/complaints',  label: 'Complaints Queue', icon: MessageSquare },
  { href: '/official/escalated',   label: 'Escalated',       icon: AlertCircle },
];

const adminNav = [
  { href: '/admin/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/admin/complaints',   label: 'All Complaints', icon: FileText },
  { href: '/admin/users',        label: 'Users',          icon: Users },
  { href: '/admin/departments',  label: 'Departments',    icon: Building2 },
  { href: '/admin/projects',     label: 'Projects',       icon: FolderOpen },
  { href: '/admin/analytics',    label: 'Analytics',      icon: BarChart3 },
];

const roleNav: Record<string, typeof citizenNav> = {
  Citizen: citizenNav,
  Official: officialNav,
  Admin: adminNav,
};

const roleLabel: Record<string, string> = {
  Admin: 'Administrator',
  Official: 'Government Official',
  Citizen: 'Citizen',
};

const roleAccent: Record<string, string> = {
  Admin: 'text-red-500',
  Official: 'text-[#1B3A6B]',
  Citizen: 'text-emerald-600',
};


export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const navItems = roleNav[user.role] || citizenNav;

  return (
    <aside className="flex h-full w-60 flex-col bg-white border-r border-gray-200">

      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-5">
        <AshokaChakra size={26} color="#1B3A6B" />
        <div>
          <p className="text-xs font-bold text-[#1A1A2E] leading-none">GovTransparency</p>
          <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide">Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {/* Role label */}
        <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">
          {roleLabel[user.role]}
        </p>

        <ul className="space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/citizen/dashboard' && item.href !== '/admin/dashboard' && item.href !== '/official/dashboard' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded px-3 py-2 text-sm transition-all',
                    isActive
                      ? 'bg-[#1B3A6B] text-white font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-[#1A1A2E] font-medium'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-gray-400')} />
                  {item.label}
                  {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-200" />}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Public links */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">Public</p>
          <ul className="space-y-0.5">
            {[
              { href: '/departments', label: 'Departments', icon: Building2 },
              { href: '/projects',    label: 'Projects',    icon: Globe },
            ].map(item => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-[#1A1A2E] transition-colors"
                  >
                    <Icon className="h-4 w-4 text-gray-400" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#1B3A6B] flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#1A1A2E]">{user.name}</p>
            <p className={`text-[10px] font-medium mt-0.5 ${roleAccent[user.role]}`}>{user.role}</p>
          </div>
          <button
            onClick={() => logoutAction()}
            title="Sign Out"
            className="h-7 w-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
