import React from 'react';
import {
  Compass,
  Target,
  Users,
  ShieldCheck
} from 'lucide-react';
import { CORE_PRINCIPLES } from '../lib/constants';
import { PrivacyNotice } from '../components/common/PrivacyNotice';
import { RoleBadge } from '../components/common/Badge';

export const AboutPage: React.FC = () => {
  const futureGoals = [
    {
      num: '1',
      title: 'Build a Larger Community Fund',
      desc: 'Grow steadily from a few thousand rupees to a sustainable, resilient fund supporting larger, urgent medical and educational cases.'
    },
    {
      num: '2',
      title: 'Expand Beyond Our Circle',
      desc: 'Approach trusted friends, relatives, and close colleagues to create a broader network of reliable, small recurring contributors.'
    },
    {
      num: '3',
      title: 'Focus on Recurring Vulnerabilities',
      desc: 'Expand systematic support to cover chronic medical treatments, tuition & school fee defaults, staple food rations, and emergency rent relief.'
    },
    {
      num: '4',
      title: 'Professionalize Transparency & Accountability',
      desc: 'Maintain impeccable auto-balanced financial records, ground verification protocols, and open public expenditure ledgers.'
    },
    {
      num: '5',
      title: 'Build an On-Ground Volunteer Network',
      desc: 'Establish trusted volunteer scouts across neighborhoods to personally verify cases at pharmacies, clinics, and schools before funds are requested.'
    },
    {
      num: '6',
      title: 'Promote Genuine Self-Dependence',
      desc: 'Help vulnerable families achieve financial independence through micro-livelihood equipment and skill opportunities rather than only recurring cash aid.'
    }
  ];

  const roleDefinitions = [
    {
      role: 'Coordinator / Secretary',
      tag: 'Coordinator',
      desc: 'Manages case discussions, core group meetings, consensus tracking, and general team coordination.'
    },
    {
      role: 'Treasurer',
      tag: 'Treasurer',
      desc: 'Maintains the fund ledger, verifies incoming UPI/cash contributions, and releases approved disbursements.'
    },
    {
      role: 'Verification / Inspection Team',
      tag: 'Verification Team',
      desc: 'Conducts ground inspections (e.g. pharmacy liaison, doctor estimates, school dues) before cases are brought for consensus.'
    },
    {
      role: 'Core Members',
      tag: 'Core Member',
      desc: 'Commit to weekly contributions, participate in case review, and collectively decide on fund releases.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Header & Principle Quote */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
          <span>Founding Charter & Philosophy</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          The 'Fikr' Initiative (Dast-e-Khair)
        </h1>

        <blockquote className="p-6 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 text-base sm:text-lg italic font-normal text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-2xl mx-auto shadow-xs">
          "{CORE_PRINCIPLES.quote}"
        </blockquote>
      </section>

      {/* Background & Context */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-600" />
          Background & Context
        </h2>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 space-y-4 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            Following deep discussions within our circle about the real, ground-level hardships that financially vulnerable families face on a daily basis, we came to a firm conclusion: while grandiose schemes often stall, small collective action can deliver immediate, life-changing relief.
          </p>
          <p>
            We see neighbors struggling under the weight of sudden hospital bills, pharmacy costs, education fee deadlines, and monthly grocery shortages. At the same time, many people genuinely want to help, but lack a trustworthy, zero-overhead avenue where every single rupee is accounted for.
          </p>
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
              The Power of Small Contributions:
            </h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              If our 9–10 core members contribute just ₹100 every week, that creates ₹900–₹1,000 weekly (~₹3,600 to ₹4,000/month). Within just a few months, a dedicated emergency reserve of ₹10,000+ is built — sufficient to clear crucial pharmacy bills, school dues, or grocery crises.
            </p>
          </div>
        </div>
      </section>

      {/* Most Important Principle */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          The Most Important Principle
        </h2>

        <div className="p-6 rounded-2xl bg-neutral-900 dark:bg-[#151518] text-white border border-neutral-800 space-y-3">
          <p className="text-sm sm:text-base leading-relaxed text-neutral-200">
            "{CORE_PRINCIPLES.mostImportantPrinciple}"
          </p>
          <div className="pt-2 border-t border-neutral-800 text-xs text-neutral-400">
            🔒 Beneficiary names and identifying details are never made public.
          </div>
        </div>
      </section>

      {/* 6 Future Goals */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            Future Goals (The Bigger Vision)
          </h2>
          <p className="text-xs text-neutral-500">
            We are starting small, but with discipline and community trust, we aim to scale our collective impact:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {futureGoals.map(goal => (
            <div
              key={goal.num}
              className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 space-y-2 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">
                  {goal.num}
                </span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {goal.title}
                </h3>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed pl-8">
                {goal.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Structure & Roles */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Governance & Operating Roles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roleDefinitions.map(r => (
            <div
              key={r.role}
              className="p-5 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {r.role}
                </h3>
                <RoleBadge role={r.tag as any} size="sm" />
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Non-Custodial Disclaimer */}
      <section>
        <PrivacyNotice />
      </section>
    </div>
  );
};
