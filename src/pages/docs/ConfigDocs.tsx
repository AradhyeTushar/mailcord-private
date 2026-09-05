import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, Callout, CodeBlock, SpecTable, Badge } from '../../components/docs/Shared';
import { Settings, Shield, Key, Server, AlertTriangle, ArrowRight, Info } from 'lucide-react';

export default function ConfigDocs() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <PageHeader
        title="Configuration"
        description="Fine-tune how NebulaMailCord behaves in your Discord server."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        {/* 1. Simple Explanation */}
        <SectionHeading id="simple">What is Server Configuration?</SectionHeading>
        <p className="text-lg text-neutral-300 mb-6 leading-relaxed">
          Configuration allows server admins to decide <strong>who has power</strong>. You can designate specific Discord roles as "Managers" or "Support" so they can help moderate without being full Server Administrators.
        </p>

        {/* 2. 🧩 How it works (Standard format) */}
        <SectionHeading id="how-it-works">🧩 The Setup Flow</SectionHeading>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 mb-12">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center">
                 <p className="text-indigo-400 font-bold text-xs mb-2">1. Run /setup</p>
                 <p className="text-neutral-500 text-[10px]">Deploys the button</p>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-neutral-800 shrink-0" />
              <div className="text-center">
                 <p className="text-indigo-400 font-bold text-xs mb-2">2. Assign Roles</p>
                 <p className="text-neutral-500 text-[10px]">Using /config</p>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-neutral-800 shrink-0" />
              <div className="text-center">
                 <p className="text-indigo-400 font-bold text-xs mb-2">3. Policies Applied</p>
                 <p className="text-emerald-400 text-[10px] font-bold">Permissions Active</p>
              </div>
           </div>
        </div>

        {/* Commands */}
        <SectionHeading id="commands">Configuration Commands</SectionHeading>
        <CodeBlock code={`/config admin-role @role\n/config manager-role @role\n/config support-role @role`} />

        {/* Roles Table */}
        <SectionHeading id="roles">Role Permission Matrix</SectionHeading>
        <SpecTable 
          headers={['Action', 'Manager', 'Support', 'Admin']}
          rows={[
            ['Deanonymize Aliases', '✅', '❌', '✅'],
            ['Delete Any Alias', '✅', '❌', '✅'],
            ['View Audit Logs', '✅', '✅', '✅'],
            ['Change Bot Config', '❌', '❌', '✅'],
          ]}
        />

        {/* 🚨 ERROR HANDLING (CRITICAL) */}
        <SectionHeading id="errors">🚨 ERROR HANDLING (CRITICAL)</SectionHeading>
        
        <div className="space-y-4 my-8">
          {[
            {
              err: '"Only administrators can use this command."',
              cause: 'You don\'t have "Manage Server" permission, which is required to change bot settings.',
              fix: 'Ask the server owner to run the command.'
            },
            {
              err: '"No roles provided to update."',
              cause: 'You ran `/config admin-role` but forgot to actually mention the @role.',
              fix: 'Run `/config admin-role role:@Staff` where @Staff is the role you want to grant power to.'
            },
            {
              err: '"Failed to save configuration."',
              cause: 'Commonly caused by a database timeout or valid role ID mismatch.',
              fix: 'Wait 30 seconds and try again. Ensure the role hasn\'t been deleted from Discord.'
            }
          ].map(({ err, cause, fix }) => (
            <div key={err} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
               <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <code className="text-red-400 font-bold text-xs uppercase">{err}</code>
              </div>
              <p className="text-neutral-400 text-xs mb-1"><strong>The Reason:</strong> {cause}</p>
              <p className="text-emerald-400 text-xs font-bold"><strong>The Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>

        {/* Tip */}
        <Callout type="info" title="Configuration is Global">
          These settings apply to everyone in your server. If you set a "Manager Role," everyone with that role will be able to see who is behind any alias in the server. Choose carefully!
        </Callout>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-neutral-800 flex justify-between items-center">
          <Link to="/docs/webhooks" className="px-6 py-3 rounded-2xl border border-neutral-800 text-neutral-400 font-bold hover:bg-neutral-900 transition-all flex items-center gap-2">
            Back: Webhooks
          </Link>
          <Link to="/docs/security" className="px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 group flex items-center gap-2">
            Next: Security <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
