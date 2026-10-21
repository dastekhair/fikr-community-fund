import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { CORE_PRINCIPLES } from '../../lib/constants';
import { Shield, Heart, FileCheck2, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-[#1f261f] bg-[#0e0f0c] text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Mission Statement */}
          <div className="md:col-span-2 space-y-3">
            <Logo size="md" />
            <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
              "{CORE_PRINCIPLES.quote}"
            </p>
            <div className="pt-2 flex items-center gap-4 text-[11px] text-neutral-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> Non-Custodial Record
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> 100% Direct Impact
              </span>
              <span className="flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5 text-sky-400" /> Complete Transparency
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              Transparency
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                  className="text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer touch-manipulation"
                >
                  Transparency Overview
                </Link>
              </li>
              <li>
                <Link
                  to="/withdrawals"
                  onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                  className="text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer touch-manipulation"
                >
                  Public Withdrawal Ledger
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                  className="text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer touch-manipulation"
                >
                  Founding Proposal & Team
                </Link>
              </li>
              <li>
                <Link
                  to="/ledger"
                  onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                  className="text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer touch-manipulation"
                >
                  Full Financial Records
                </Link>
              </li>
            </ul>
          </div>

          {/* Core Member Tools */}
          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] mb-3">
              Core Member Tools
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/cases"
                  onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                  className="text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer touch-manipulation"
                >
                  Case Review & Voting
                </Link>
              </li>
              <li>
                <Link
                  to="/withdrawals/new"
                  onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                  className="text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer touch-manipulation"
                >
                  Record Fund Release
                </Link>
              </li>
              <li>
                <Link
                  to="/contributions"
                  onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                  className="text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer touch-manipulation"
                >
                  Weekly Contribution Tracker
                </Link>
              </li>
              <li>
                <Link
                  to="/members"
                  onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                  className="text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer touch-manipulation"
                >
                  Member Directory & Roles
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Non-Custodial Disclaimer */}
        <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <p>
            © {new Date().getFullYear()} Fikr (Dast-e-Khair). A grassroots mutual aid initiative. Not a financial custodian or payment gateway.
          </p>
          <div className="flex items-center gap-3">
            <span>Minimum Contribution: ₹100/week</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Free & Open Source</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
