import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, Callout, SpecTable, Badge } from '../../components/docs/Shared';
import { Lock, Shield, Eye, Key, Server, AlertTriangle, ArrowRight, Info } from 'lucide-react';

export default function SecurityDocs() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <PageHeader
        title="Security & Privacy"
        description="How NebulaMailCord balances absolute privacy with community safety."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        {/* 1. Simple Explanation */}
        <SectionHeading id="simple">The Privacy Mission</SectionHeading>
        <p className="text-lg text-neutral-300 mb-6 leading-relaxed">
          NebulaMailCord is designed so that <strong>no regular user</strong> can ever know your real identity. However, to prevent harassment, server admins can "Deanonymize" a user if they misbehave. 
          <br /><br />
          <em>"Privacy for users, accountability for abusers."</em>
        </p>

        {/* 2. 🧩 How it works (Standard format) */}
        <SectionHeading id="how-it-works">🧩 How Data is Protected</SectionHeading>
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 mb-8">
           <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                 <p className="text-neutral-300 text-sm">Your real ID (e.g. 182736...) is mapped to your alias in a <strong>secure database</strong>.</p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                 <p className="text-neutral-400 text-sm">When you send mail, the bot <strong>strips all metadata</strong> (avatar, name, profile) from the message.</p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                 <p className="text-neutral-300 text-sm italic">"Only a high-level admin command can re-link these two pieces of information."</p>
              </div>
           </div>
        </div>

        {/* Data Principles */}
        <SectionHeading id="principles">Core Security Principles</SectionHeading>
        <div className="grid md:grid-cols-2 gap-4 my-8">
           <HighlightCard title="Data Minimization" description="We only store what is needed to route mail. Message content is deleted after delivery by default." icon={Lock} variant="indigo" />
           <HighlightCard title="Audit Logging" description="Every single time an admin looks up an identity, it is logged publicly to the server's audit channel." icon={Eye} variant="neutral" />
        </div>

        {/* Data Table */}
        <SectionHeading id="data">What do we store?</SectionHeading>
        <SpecTable 
          headers={['Data Type', 'Stored?', 'Who can see?']}
          rows={[
            ['Real Discord ID', '✅ Yes', 'System + Admins'],
            ['Message Content', '❌ No (Temp only)', 'Only You'],
            ['Avatar / Profile', '❌ No', 'No one'],
            ['Alias Usage Stats', '✅ Yes', 'You + Admins'],
          ]}
        />

        {/* 🚨 ERROR HANDLING (CRITICAL) */}
        <SectionHeading id="errors">🚨 ERROR HANDLING (CRITICAL)</SectionHeading>
        
        <div className="space-y-4 my-8">
          {[
            {
              err: '"Audit Channel not found."',
              cause: 'An admin tried to deanonymize someone, but the #mailcord-audit channel was deleted.',
              fix: 'The action is blocked for safety. Admins must recreate the audit channel first.'
            },
            {
              err: '"Signature verification failed."',
              cause: 'A webhook was received but the security key didn\'t match.',
              fix: 'Ensure your app is using the correct WEBHOOK_SECRET from the dashboard.'
            },
            {
              err: '"Account flagged for suspicious activity."',
              cause: 'You attempted to create hundreds of aliases in a few minutes.',
              fix: 'Your account is temporarily locked. Contact support or wait 24 hours.'
            }
          ].map(({ err, cause, fix }) => (
            <div key={err} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
               <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <code className="text-red-400 font-bold text-xs uppercase">{err}</code>
              </div>
              <p className="text-neutral-400 text-xs mb-1"><strong>Security Risk:</strong> {cause}</p>
              <p className="text-emerald-400 text-xs font-bold"><strong>Resolution:</strong> {fix}</p>
            </div>
          ))}
        </div>

        {/* Tip */}
        <Callout type="warning" title="Anonymity is not a Shield for Hate">
          NebulaMailCord exists to protect privacy, not to facilitate harassment. We cooperate fully with Discord Trust & Safety if illegal activity is detected.
        </Callout>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-neutral-800 flex justify-between items-center">
          <Link to="/docs/config" className="px-6 py-3 rounded-2xl border border-neutral-800 text-neutral-400 font-bold hover:bg-neutral-900 transition-all flex items-center gap-2">
            Back: Configuration
          </Link>
          <Link to="/docs/billing" className="px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 group flex items-center gap-2">
            Next: Scaling <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
