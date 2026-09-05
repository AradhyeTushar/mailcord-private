import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, Callout, SpecTable, Badge } from '../../components/docs/Shared';
import { TrendingUp, Zap, CreditCard, Gift, AlertTriangle, ArrowRight, Info } from 'lucide-react';

export default function ScalingDocs() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <PageHeader
        title="Scaling & Plans"
        description="Understand limits, plans, and how to unlock the full power of NebulaMailCord."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        {/* 1. Simple Explanation */}
        <SectionHeading id="simple">How Plans Work</SectionHeading>
        <p className="text-lg text-neutral-300 mb-6 leading-relaxed">
          NebulaMailCord uses a <strong>Tiered System</strong>. As your community grows, you can upgrade your personal account (for more aliases) or your entire server (to boost limits for everyone in that community).
        </p>

        {/* 2. 🧩 How it works (Standard format) */}
        <SectionHeading id="how-it-works">🧩 How to Upgrade</SectionHeading>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 mb-12">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center">
                 <p className="text-white font-bold text-xs mb-2">1. Choose Tier</p>
                 <p className="text-neutral-500 text-[10px]">In /user settings</p>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-neutral-800 shrink-0" />
              <div className="text-center">
                 <p className="text-white font-bold text-xs mb-2">2. Pay via Razorpay</p>
                 <p className="text-neutral-500 text-[10px]">Secure Link</p>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-neutral-800 shrink-0" />
              <div className="text-center">
                 <p className="text-white font-bold text-xs mb-2">3. Sync Limits</p>
                 <p className="text-emerald-400 text-[10px] font-bold">Instantly Unlocked</p>
              </div>
           </div>
        </div>

        {/* User Plans */}
        <SectionHeading id="user-plans">User Plans</SectionHeading>
        <SpecTable 
          headers={['Benefit', 'Free', 'Premium', 'Supreme']}
          rows={[
            ['Max Aliases', 'Random/Limited', '100', 'Unlimited'],
            ['Custom Names', '❌ No', '✅ Yes', '✅ Yes'],
            ['Wait Time', 'High', 'Medium', 'Zero'],
            ['Support', 'Community', 'Standard', 'Priority'],
          ]}
        />

        {/* Server Plans */}
        <SectionHeading id="server-plans">Server Upgrades</SectionHeading>
        <p className="text-neutral-400 text-sm mb-4">Upgrading a server boosts limits for <strong>every member</strong> in that server.</p>
        <div className="grid md:grid-cols-2 gap-4 my-8">
           <HighlightCard title="Pro Server" description="25 extra aliases for every user. 3-day message history." icon={Zap} variant="indigo" />
           <HighlightCard title="Enterprise" description="50 extra aliases per user. Unlimited history + Priority bot routing." icon={TrendingUp} variant="neutral" />
        </div>

        {/* 🚨 ERROR HANDLING (CRITICAL) */}
        <SectionHeading id="errors">🚨 ERROR HANDLING (CRITICAL)</SectionHeading>
        
        <div className="space-y-4 my-8">
          {[
            {
              err: '"Invalid or expired redemption code."',
              cause: 'You typed the 8-digit code wrong or it has already been used by someone else.',
              fix: 'Check the code carefully. Remember: codes like PRO11 only work once per account.'
            },
            {
              err: '"Only server administrators can redeem server codes."',
              cause: 'You tried to upgrade the server tier (SRV_PRO) but aren\'t a Discord admin.',
              fix: 'Ask an admin to redeem the server-wide code.'
            },
            {
              err: '"No active subscription found for this ID."',
              cause: 'You clicked "Sync & Refresh" before the payment was fully processed.',
              fix: 'Wait 60 seconds for Razorpay to sync and click Refresh again.'
            }
          ].map(({ err, cause, fix }) => (
            <div key={err} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
               <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <code className="text-amber-400 font-bold text-xs uppercase">{err}</code>
              </div>
              <p className="text-neutral-400 text-xs mb-1"><strong>Reason:</strong> {cause}</p>
              <p className="text-emerald-400 text-xs font-bold"><strong>Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>

        {/* Tip */}
        <Callout type="info" title="Redeem Codes">
          Have a voucher? Go to <code>/user settings</code> → click <strong>Redeem Code</strong> → paste your code. (Try code <code>PRO11</code> for a free premium trial!)
        </Callout>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-neutral-800 flex justify-between items-center">
          <Link to="/docs/security" className="px-6 py-3 rounded-2xl border border-neutral-800 text-neutral-400 font-bold hover:bg-neutral-900 transition-all flex items-center gap-2">
            Back: Security
          </Link>
          <Link to="/docs/faq" className="px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 group flex items-center gap-2">
            Next: FAQ <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
