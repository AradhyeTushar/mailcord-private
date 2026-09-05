import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, Callout, CodeBlock, SpecTable, Badge } from '../../components/docs/Shared';
import { User, Settings, CreditCard, RefreshCw, AlertTriangle, ArrowRight, Info } from 'lucide-react';

export default function UserGuide() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <PageHeader
        title="User Guide"
        description="Master your profile, manage your plan, and keep your account secure."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        {/* 1. Simple Explanation */}
        <SectionHeading id="simple">What is the User Profile?</SectionHeading>
        <p className="text-lg text-neutral-300 mb-6 leading-relaxed">
          Your **User Profile** is where NebulaMailCord stores your global settings. It tracks your current subscription plan and your "Recovery Info" (the email and phone used to get your aliases back if you lose access).
        </p>

        {/* 2. 🧩 How it works (Standard format) */}
        <SectionHeading id="how-it-works">🧩 How It Works</SectionHeading>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 mb-12">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                 <p className="text-indigo-400 font-bold text-sm mb-2">1. Settings</p>
                 <p className="text-neutral-500 text-xs leading-relaxed">You run <code>/user settings</code> to open your dashboard.</p>
              </div>
              <div className="text-center">
                 <p className="text-indigo-400 font-bold text-sm mb-2">2. Management</p>
                 <p className="text-neutral-500 text-xs leading-relaxed">You update recovery info or upgrade your plan.</p>
              </div>
              <div className="text-center">
                 <p className="text-indigo-400 font-bold text-sm mb-2">3. Sync</p>
                 <p className="text-neutral-500 text-xs leading-relaxed">Bot syncs with web data to unlock feature limits.</p>
              </div>
           </div>
        </div>

        {/* Commands */}
        <SectionHeading id="commands">User Commands</SectionHeading>
        <CodeBlock code={`/user settings   (Opens the main dashboard)\n/user plan       (Quick look at your limits)\n/user restore    (Admin recovery - Supreme only)`} />

        {/* Plan Table */}
        <SectionHeading id="plans">Compare Plans</SectionHeading>
        <SpecTable 
          headers={['Feature', 'Free', 'Premium', 'Supreme']}
          rows={[
            ['Aliases', 'Limited (Random)', '100 (Custom Names)', 'Unlimited'],
            ['Message Retention', '24 Hours', '3 Days', 'Unlimited'],
            ['Webhooks', '❌', '✅', '✅'],
            ['AI Email Analysis', '❌', '❌', '✅'],
            ['Price', 'Free', '₹199/mo', '₹499/mo'],
          ]}
        />

        {/* 🚨 ERROR HANDLING (CRITICAL) */}
        <SectionHeading id="errors">🚨 ERROR HANDLING (CRITICAL)</SectionHeading>
        
        <div className="space-y-4 my-8">
          {[
            {
              err: '"You must set a recovery email first."',
              cause: 'You tried to create an alias but haven\'t told the bot how to reach you in emergencies.',
              fix: 'Click "Recovery Settings" in the /user settings dashboard and fill in your email + phone.'
            },
            {
              err: '"Invalid email or phone format."',
              cause: 'You used an invalid email or an incomplete phone number in the recovery modal.',
              fix: 'Email must have "@" (e.g. you@mail.com). Phone must have 10+ digits including area code.'
            },
            {
              err: '"Restore is only available for Supreme users."',
              cause: 'You tried to use `/user restore` but your plan isn\'t high enough.',
              fix: 'Upgrade to Supreme to use bulk identity restoration.'
            },
            {
              err: '"No matching account found with that info."',
              cause: 'You are trying to recover aliases from an old account but the recovery info doesn\'t match.',
              fix: 'Double-check the EXACT email and phone you used on your prior Discord account.'
            }
          ].map(({ err, cause, fix }) => (
            <div key={err} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
               <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <code className="text-amber-400 font-bold text-xs uppercase">{err}</code>
              </div>
              <p className="text-neutral-400 text-xs mb-1"><strong>The Reason:</strong> {cause}</p>
              <p className="text-emerald-400 text-xs font-bold"><strong>The Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>

        {/* Tip */}
        <Callout type="info" title="Sync & Refresh">
          If you just paid for a plan and don't see your new limits, click the <strong>Refresh My Plan</strong> or <strong>Sync & Refresh</strong> button in your `/user settings` dashboard. This forces the bot to check with the billing server.
        </Callout>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-neutral-800 flex justify-between items-center">
          <Link to="/docs/inbox" className="px-6 py-3 rounded-2xl border border-neutral-800 text-neutral-400 font-bold hover:bg-neutral-900 transition-all flex items-center gap-2">
            Back: Inbox System
          </Link>
          <Link to="/docs/admin-guide" className="px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 group flex items-center gap-2">
            Next: Admin Guide <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
