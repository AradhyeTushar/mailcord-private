import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, Callout, CodeBlock, SpecTable, Badge, DiscordMockup } from '../../components/docs/Shared';
import { Shield, Eye, Trash2, ShieldAlert, AlertTriangle, ArrowRight, Info } from 'lucide-react';

export default function AdminGuide() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <PageHeader
        title="Admin Guide"
        description="Governance, auditing, and server-wide moderation tools for administrators."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        {/* 1. Simple Explanation */}
        <SectionHeading id="simple">What are Admin Tools?</SectionHeading>
        <p className="text-lg text-neutral-300 mb-6 leading-relaxed">
          Admin tools allow you to manage the NebulaMailCord system in your server. This includes <strong>deanonymizing</strong> abusers, force-deleting aliases, and configuring which roles can access moderation features.
        </p>

        {/* 2. 🧩 How it works (Standard format) */}
        <SectionHeading id="how-it-works">🧩 How Auditing Works</SectionHeading>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 mb-12">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center text-center">
                 <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-2 border border-indigo-500/20">
                    <Eye className="w-5 h-5 text-indigo-400" />
                 </div>
                 <p className="text-white font-bold text-xs">Run /admin search</p>
                 <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">Step 1</p>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-neutral-800" />
              <div className="flex flex-col items-center text-center">
                 <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-2 border border-amber-500/20">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                 </div>
                 <p className="text-white font-bold text-xs">Identity Revealed</p>
                 <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">Step 2 (Private)</p>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-neutral-800" />
              <div className="flex flex-col items-center text-center">
                 <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-2 border border-red-500/20">
                    <Trash2 className="w-5 h-5 text-red-400" />
                 </div>
                 <p className="text-white font-bold text-xs">Audit Event Logged</p>
                 <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">Step 3 (Public)</p>
              </div>
           </div>
           <p className="text-center text-neutral-500 text-xs mt-8">Anonymity is not a free pass for abuse. All admin lookups are logged for accountability.</p>
        </div>

        {/* Commands */}
        <SectionHeading id="commands">Admin Commands Reference</SectionHeading>
        <CodeBlock code={`/admin alias-search <name>  (Reveal the owner of an alias)\n/admin force-delete <name>  (Instantly erase an alias)\n/admin user-info @user      (List all aliases for an ID)`} />
        
        <DiscordMockup messages={[
          {
            user: 'AdminMarcus',
            content: <code className="text-xs text-indigo-300">/admin alias-search name:shadow</code>,
            time: '5:00 PM'
          },
          {
            user: 'NebulaMailCord',
            isBot: true,
            avatar: 'N',
            content: (
              <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl">
                 <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">🔍 Audit Search Result</p>
                 <div className="flex justify-between items-center">
                    <div>
                       <p className="text-neutral-500 text-[10px] uppercase font-bold">Alias</p>
                       <p className="text-white text-xs font-mono">shadow</p>
                    </div>
                    <div>
                       <p className="text-neutral-500 text-[10px] uppercase font-bold">Real Identity</p>
                       <p className="text-indigo-400 text-xs font-bold tracking-tight">@TroubleMaker#0001</p>
                    </div>
                 </div>
                 <p className="text-neutral-600 text-[10px] mt-4 italic">This event has been logged to #mailcord-audit.</p>
              </div>
            ),
            time: '5:00 PM'
          }
        ]} />

        {/* 🚨 ERROR HANDLING (CRITICAL) */}
        <SectionHeading id="errors">🚨 ERROR HANDLING (CRITICAL)</SectionHeading>
        
        <div className="space-y-4 my-8">
          {[
            {
              err: '"Only administrators can use this command."',
              cause: 'You don\'t have either the "Manage Server" permission or the correct "Admin Role" assigned locally.',
              fix: 'Ask the server owner to add your role to `/config admin-role`.'
            },
            {
              err: '"Not found."',
              cause: 'You ran `/admin alias-search` for an alias that doesn\'t exist in our global system.',
              fix: 'Check the spelling! Make sure you aren\'t including the "@" symbol in the search bar.'
            },
            {
              err: '"Requires Discord Manage Server permission."',
              cause: 'You tried to redeem a server upgrade code but don\'t have high-level Discord permissions.',
              fix: 'Ensure you have the "Manage Server" perm enabled in your Discord role settings.'
            }
          ].map(({ err, cause, fix }) => (
            <div key={err} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
               <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <code className="text-red-400 font-bold text-xs uppercase">{err}</code>
              </div>
              <p className="text-neutral-400 text-xs mb-1"><strong>Reason:</strong> {cause}</p>
              <p className="text-emerald-400 text-xs font-bold"><strong>Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>

        {/* Tip */}
        <Callout type="warning" title="Audit Accountability">
          Use deanonymization tools only for evidence-based moderation. Every time you search an alias, an alert is sent to the server's audit logs. Abuse of admin powers can lead to server-wide suspension of NebulaMailCord.
        </Callout>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-neutral-800 flex justify-between items-center">
          <Link to="/docs/user-guide" className="px-6 py-3 rounded-2xl border border-neutral-800 text-neutral-400 font-bold hover:bg-neutral-900 transition-all flex items-center gap-2">
            Back: User Guide
          </Link>
          <Link to="/docs/use-cases" className="px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 group flex items-center gap-2">
            Next: Use Cases <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
