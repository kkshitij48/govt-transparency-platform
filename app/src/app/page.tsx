import Link from 'next/link';
import {
  ArrowRight, FileText, CheckCircle2, Clock, Shield,
  Building2, Landmark, HeartPulse, GraduationCap,
  Hammer, Scale, Leaf, ChevronRight, Lock, Globe, BarChart3
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { AshokaChakra } from '@/components/ui/ashoka-chakra';
import { getCurrentUser } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';

// ── Dashboard Preview Mockup ─────────────────────────────────────────────────
function DashboardMockup() {
  const complaints = [
    { ref: 'CMP-00142', dept: 'Ministry of Finance', status: 'Resolved', statusColor: 'bg-emerald-100 text-emerald-700' },
    { ref: 'CMP-00891', dept: 'Ministry of Health', status: 'Under Review', statusColor: 'bg-amber-100 text-amber-700' },
    { ref: 'CMP-01034', dept: 'Ministry of Infrastructure', status: 'In Progress', statusColor: 'bg-blue-100 text-blue-700' },
    { ref: 'CMP-01201', dept: 'Ministry of Education', status: 'Submitted', statusColor: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <div className="relative">
      {/* Floating glow */}
      <div className="absolute -inset-4 bg-[#1B3A6B]/5 rounded-2xl blur-2xl" />

      <div className="relative bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden">
        {/* Mock browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <div className="mx-3 flex-1 rounded bg-gray-200 h-4 max-w-[180px]" />
        </div>

        {/* Mock dashboard content */}
        <div className="p-5">
          {/* Top stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total Filed', value: '12,847', color: 'border-[#1B3A6B]', text: 'text-[#1B3A6B]' },
              { label: 'Resolved', value: '11,424', color: 'border-emerald-500', text: 'text-emerald-600' },
              { label: 'Escalated', value: '89', color: 'border-red-400', text: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className={`rounded-lg border-l-4 ${s.color} bg-gray-50 p-3`}>
                <p className={`text-lg font-bold leading-none ${s.text}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Resolution bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-500">Resolution Rate</span>
              <span className="text-xs font-bold text-[#1B3A6B]">89%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-[#1B3A6B]" style={{ width: '89%' }} />
            </div>
          </div>

          {/* Table header */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Complaints</p>

          {/* Complaint rows */}
          <div className="space-y-2">
            {complaints.map(c => (
              <div key={c.ref} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-[#1A1A2E]">{c.ref}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{c.dept}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.statusColor}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating stat card */}
      <div className="absolute -bottom-4 -left-6 bg-white rounded-lg border border-gray-200 shadow-xl px-4 py-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#1A1A2E]">Resolved Today</p>
          <p className="text-lg font-bold text-emerald-600 leading-none">+47</p>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-4 -right-4 bg-[#1B3A6B] text-white rounded-lg shadow-xl px-3 py-2">
        <p className="text-xs font-semibold">Avg Response</p>
        <p className="text-xl font-bold leading-none">4.2 <span className="text-sm font-normal opacity-75">days</span></p>
      </div>
    </div>
  );
}

// ── Department icon map ──────────────────────────────────────────────────────
const deptConfig: Record<string, { icon: React.ElementType; color: string; border: string }> = {
  'Ministry of Finance':        { icon: Landmark,   color: 'text-[#1B3A6B]',  border: 'border-l-[#1B3A6B]'  },
  'Ministry of Health':         { icon: HeartPulse,  color: 'text-rose-600',    border: 'border-l-rose-500'    },
  'Ministry of Education':      { icon: GraduationCap, color: 'text-violet-600', border: 'border-l-violet-500' },
  'Ministry of Infrastructure': { icon: Hammer,       color: 'text-amber-600',   border: 'border-l-amber-500'   },
  'Ministry of Justice':        { icon: Scale,        color: 'text-slate-700',   border: 'border-l-slate-500'   },
  'Ministry of Environment':    { icon: Leaf,         color: 'text-emerald-600', border: 'border-l-emerald-500' },
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const [user, supabase] = await Promise.all([getCurrentUser(), createClient()]);
  const { data: departments } = await supabase
    .from('departments')
    .select('department_id, department_name, description')
    .limit(6);

  const dashHref =
    !user ? '/auth/register'
    : user.role === 'Admin' ? '/admin/dashboard'
    : user.role === 'Official' ? '/official/dashboard'
    : '/citizen/dashboard';

  return (
    <div className="min-h-screen bg-[#F9FAFB]">

      {/* ── Tricolor stripe ─────────────────────────────────── */}
      <div className="flex h-[4px] w-full">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white border-y border-gray-200" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      <Navbar user={user} />

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-5 lg:items-center">

          {/* Left — copy */}
          <div className="lg:col-span-3">
            <div className="inline-flex items-center gap-2 rounded border border-[#1B3A6B]/20 bg-[#1B3A6B]/5 px-3 py-1.5 mb-8">
              <AshokaChakra size={14} color="#1B3A6B" />
              <span className="text-xs font-semibold text-[#1B3A6B] tracking-wide uppercase">
                Official Government Portal
              </span>
            </div>

            <h1 className="font-heading text-5xl font-bold leading-[1.1] text-[#1A1A2E] lg:text-6xl">
              Transparent
              <br />
              Government.{' '}
              <span className="relative inline-block">
                Accountable
                <span className="absolute bottom-1 left-0 w-full h-[5px] bg-[#F59E0B] opacity-60 rounded" />
              </span>
              <br />
              Officials.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-gray-500 leading-relaxed" style={{ fontFamily: 'var(--font-sans)' }}>
              A secure, citizen-first platform where every complaint is tracked,
              every response is documented, and every government action is open
              to public scrutiny.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href={dashHref}
                className="inline-flex items-center gap-2 bg-[#1B3A6B] text-white px-6 py-3 text-sm font-semibold rounded hover:bg-[#152e58] transition-colors"
              >
                {user ? 'Go to Dashboard' : 'Get Started'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 border border-[#1B3A6B] text-[#1B3A6B] px-6 py-3 text-sm font-semibold rounded hover:bg-[#1B3A6B]/5 transition-colors"
              >
                How It Works
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-12 flex flex-wrap items-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                256-bit SSL Encryption
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Row-Level Security
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Available 24 × 7
              </span>
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div className="lg:col-span-2">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────── */}
      <section className="border-y border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-200">
            {[
              { value: '12,847', label: 'Complaints Filed', sub: 'since launch' },
              { value: '89%',    label: 'Resolution Rate',  sub: 'industry leading' },
              { value: '4.2',    label: 'Days Avg Response', sub: 'target: < 7 days' },
              { value: '8',      label: 'Departments',       sub: 'fully integrated' },
            ].map(stat => (
              <div key={stat.label} className="px-8 py-8 border-l-4 border-l-[#F59E0B] ml-[-1px]">
                <p className="text-3xl font-bold text-[#1B3A6B]">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-[#1A1A2E]">{stat.label}</p>
                <p className="mt-0.5 text-xs text-gray-400">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPARTMENTS ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-10">
          <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-widest mb-2">Departments</p>
          <h2 className="font-heading text-3xl font-bold text-[#1A1A2E]">
            Six Ministries. One Platform.
          </h2>
          <p className="mt-2 text-gray-500 max-w-xl">
            Every complaint is routed to the correct ministry and assigned to a verified official.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments?.map(dept => {
            const cfg = deptConfig[dept.department_name] || { icon: Building2, color: 'text-gray-600', border: 'border-l-gray-400' };
            const Icon = cfg.icon;
            return (
              <Link key={dept.department_id} href={`/projects?dept=${dept.department_id}`}>
                <div className={`group bg-white border border-gray-200 border-l-4 ${cfg.border} rounded-lg p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer h-full`}>
                  <div className="flex items-start justify-between">
                    <div className={`h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center ${cfg.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-[#1A1A2E] group-hover:text-[#1B3A6B] transition-colors">
                    {dept.department_name}
                  </h3>
                  {dept.description && (
                    <p className="mt-1 text-xs text-gray-400 line-clamp-2">{dept.description}</p>
                  )}
                  <p className="mt-3 text-[10px] text-gray-300 font-medium uppercase tracking-wide">
                    View Projects →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="mb-12">
            <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-widest mb-2">Process</p>
            <h2 className="font-heading text-3xl font-bold text-[#1A1A2E]">How It Works</h2>
            <p className="mt-2 text-gray-500 max-w-xl">
              A rigorous, auditable 9-stage lifecycle ensures every complaint reaches resolution.
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3">
            {/* Connector line */}
            <div className="absolute top-10 left-[16.5%] right-[16.5%] hidden md:block border-t-2 border-dashed border-gray-200" />

            {[
              {
                num: '01',
                icon: FileText,
                title: 'Submit Your Complaint',
                desc: 'Log in, select the responsible ministry, describe the issue in detail, and choose a priority level. Your reference number is generated instantly.',
              },
              {
                num: '02',
                icon: Shield,
                title: 'Official Review & Action',
                desc: 'A verified government official reviews your complaint, may request additional information, validates it, and takes corrective action.',
              },
              {
                num: '03',
                icon: CheckCircle2,
                title: 'Resolution & Feedback',
                desc: 'You receive an official written response. If satisfied, close the complaint. If not, reopen it for reinvestigation.',
              },
            ].map(step => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="relative">
                  <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gray-100 bg-white shadow-sm">
                    <Icon className="h-7 w-7 text-[#1B3A6B]" />
                    {/* Watermark number */}
                    <span className="absolute -top-3 -right-3 text-5xl font-black text-gray-100 leading-none select-none" style={{ fontFamily: 'var(--font-heading)' }}>
                      {step.num}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[#1A1A2E]">{step.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHY THIS PLATFORM ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-10">
          <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-widest mb-2">Why Us</p>
          <h2 className="font-heading text-3xl font-bold text-[#1A1A2E]">Built for Governance</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Lock,         title: 'Encrypted End-to-End', desc: 'All data is protected at rest and in transit with military-grade 256-bit TLS encryption.' },
            { icon: BarChart3,    title: 'Real-Time Analytics',  desc: 'Administrators monitor complaint trends, SLA breaches, and resolution rates in real time.' },
            { icon: Shield,       title: 'Role-Based Access',    desc: 'Citizens, officials, and admins each see only the data they are authorised to view.' },
            { icon: Globe,        title: 'Always Available',     desc: '99.9% uptime SLA. Citizens can file complaints and track status 24 hours a day.' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="h-10 w-10 rounded-lg bg-[#1B3A6B]/8 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-[#1B3A6B]" />
                </div>
                <h3 className="text-sm font-bold text-[#1A1A2E] mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA BAND ─────────────────────────────────────────── */}
      <section className="bg-[#1B3A6B]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-heading text-3xl font-bold text-white">
              Your voice matters. Use it.
            </h2>
            <p className="mt-2 text-blue-200 max-w-lg">
              Join thousands of citizens already holding government accountable through transparent, documented engagement.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href="/auth/register"
              className="px-6 py-3 bg-[#F59E0B] text-[#1A1A2E] text-sm font-bold rounded hover:bg-[#d97706] transition-colors"
            >
              Register Free
            </Link>
            <Link
              href="/projects"
              className="px-6 py-3 border border-white/30 text-white text-sm font-semibold rounded hover:bg-white/10 transition-colors"
            >
              Browse Projects
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-[#111827] border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <AshokaChakra size={28} color="#E5E7EB" />
                <span className="text-sm font-bold text-gray-100">GovTransparency</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                An official government accountability platform. All transactions are logged, audited, and protected under data protection regulations.
              </p>
              <div className="flex h-[3px] w-20 mt-4">
                <div className="flex-1 bg-[#FF9933]" />
                <div className="flex-1 bg-white/20" />
                <div className="flex-1 bg-[#138808]" />
              </div>
            </div>

            {/* Links */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Platform</p>
              <ul className="space-y-2">
                {[['/', 'Home'], ['/about', 'About'], ['/departments', 'Departments'], ['/projects', 'Projects']].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-xs text-gray-500 hover:text-gray-200 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Access</p>
              <ul className="space-y-2">
                {[['/auth/login', 'Sign In'], ['/auth/register', 'Register'], ['/citizen/complaints/new', 'File Complaint']].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-xs text-gray-500 hover:text-gray-200 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-gray-600">
              © {new Date().getFullYear()} Government Transparency Platform. All rights reserved.
            </p>
            <p className="text-[11px] text-gray-600">
              Secured · Audited · OWASP Compliant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
