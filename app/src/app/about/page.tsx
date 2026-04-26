import Link from 'next/link';
import { Eye, Lock, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { getCurrentUser } from '@/lib/actions/auth';

export const metadata = { title: 'About' };

const values = [
  {
    title: 'Radical Transparency',
    desc: 'Every complaint, response, and resolution is tracked and publicly auditable. Citizens deserve to see exactly how their concerns are handled.',
    icon: Eye,
    topColor: 'bg-[#F59E0B]',
    iconBg: 'bg-amber-50',
    iconColor: 'text-[#F59E0B]',
  },
  {
    title: 'Security First',
    desc: 'Government-grade encryption, Row Level Security, and strict access controls ensure your data is protected at every layer of the stack.',
    icon: Lock,
    topColor: 'bg-[#1B3A6B]',
    iconBg: 'bg-blue-50',
    iconColor: 'text-[#1B3A6B]',
  },
  {
    title: 'Citizen Empowerment',
    desc: 'We give every citizen direct access to their government. No intermediaries, no bureaucratic barriers — just accountability.',
    icon: Users,
    topColor: 'bg-emerald-500',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
];

const stages = [
  { status: 'Submitted',   desc: 'Citizen submits a detailed complaint with supporting evidence' },
  { status: 'UnderReview', desc: 'Official reviews the complaint for validity and completeness' },
  { status: 'PendingInfo', desc: 'Additional information requested from the citizen if needed' },
  { status: 'InProgress',  desc: 'Validated complaint is being actively addressed by the department' },
  { status: 'Escalated',   desc: 'SLA breach or complex issues escalated to higher authority' },
  { status: 'Resolved',    desc: 'Department has taken corrective action and filed resolution report' },
  { status: 'Closed',      desc: 'Citizen satisfied — complaint permanently archived' },
  { status: 'Reopened',    desc: 'Citizen unsatisfied — complaint reopened for reinvestigation' },
  { status: 'Rejected',    desc: 'Invalid or duplicate complaints rejected with mandatory explanation' },
];

const stats = [
  { value: '9',    label: 'Complaint stages' },
  { value: '3',    label: 'Role levels' },
  { value: '100%', label: 'Audit coverage' },
  { value: 'RLS',  label: 'Row-level security' },
];

export default async function AboutPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />

      {/* ── Top band ─────────────────────────────────────────────── */}
      <section className="bg-[#F3F4F6] border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
            <Link href="/" className="hover:text-[#1B3A6B] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-600">About</span>
          </div>

          <h1 className="font-heading text-4xl font-bold text-[#1A1A2E] leading-tight">
            About the{' '}
            <span className="relative inline-block">
              Platform
              <span
                className="absolute -bottom-1 left-0 h-[3px] w-full bg-[#F59E0B]"
                aria-hidden="true"
              />
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-gray-500 leading-relaxed">
            The Government Transparency &amp; Accountability Platform is a secure, enterprise-grade
            system designed to bridge the gap between citizens and their government through
            transparent, auditable complaint management.
          </p>
        </div>
      </section>

      {/* ── Mission + Stats (two columns) ───────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Left — mission text */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1B3A6B] mb-3">
              Our Mission
            </p>
            <h2 className="font-heading text-2xl font-bold text-[#1A1A2E] mb-5">
              Making every voice count
            </h2>
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                To create a world where every citizen's voice is heard, every complaint is addressed,
                and every government action is transparent and accountable. We believe that
                transparency is the foundation of trust between government and citizens.
              </p>
              <p>
                Our platform eliminates information asymmetry — citizens can see exactly where their
                complaint stands, which official is handling it, what action has been taken, and
                whether the resolution was satisfactory.
              </p>
              <p>
                Every interaction is timestamped, logged, and immutable. Officials are accountable
                not just to their superiors but to the public record itself.
              </p>
            </div>
          </div>

          {/* Right — stats list */}
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex items-center gap-5 px-7 py-5 ${i < stats.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <p className="font-heading text-3xl font-bold text-[#1B3A6B] w-20 shrink-0">{s.value}</p>
                <p className="text-sm font-medium text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value cards ─────────────────────────────────────────── */}
      <section className="bg-[#F9FAFB] border-y border-gray-200 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Core Principles</p>
          <h2 className="font-heading text-2xl font-bold text-[#1A1A2E] mb-8">What we stand for</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {values.map(v => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className={`h-1 w-full ${v.topColor}`} />
                  <div className="p-6">
                    <div className={`h-10 w-10 rounded-lg ${v.iconBg} flex items-center justify-center mb-4`}>
                      <Icon className={`h-5 w-5 ${v.iconColor}`} />
                    </div>
                    <h3 className="text-sm font-bold text-[#1A1A2E] mb-2">{v.title}</h3>
                    <p className="text-xs leading-relaxed text-gray-500">{v.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Complaint lifecycle ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Workflow</p>
        <h2 className="font-heading text-2xl font-bold text-[#1A1A2E] mb-2">The 9-stage complaint lifecycle</h2>
        <p className="text-sm text-gray-500 mb-8 max-w-xl">
          Every complaint passes through a rigorous, auditable workflow ensuring complete accountability at each step.
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage, idx) => (
            <div
              key={stage.status}
              className="flex items-start gap-4 rounded border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B3A6B] text-[10px] font-bold text-white">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div>
                <p className="text-xs font-bold text-[#1A1A2E]">{stage.status}</p>
                <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{stage.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────────── */}
      <section className="bg-[#1B3A6B] py-14">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-heading text-2xl font-bold text-white mb-3">
            Join the transparency movement
          </h2>
          <p className="text-blue-200 text-sm mb-7">
            Register today and start making your government accountable.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#1A1A2E] text-sm font-bold px-6 py-3 rounded hover:bg-[#f0930a] transition-colors"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 bg-[#0F172A] py-8">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Government Transparency Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
