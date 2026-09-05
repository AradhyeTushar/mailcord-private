import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, Callout, CodeBlock, SpecTable, Badge } from '../../components/docs/Shared';
import { Rocket, ShieldCheck, AlertTriangle, CheckCircle, Info, ArrowRight, Zap } from 'lucide-react';

// 🖼️ Custom Emoji Assets
import boltPng from '../../assets/docs/emojis/bolt.png';
import discordPng from '../../assets/docs/emojis/discord.png';
import websitePng from '../../assets/docs/emojis/website.png';
import verifyGif from '../../assets/docs/emojis/verify.gif';

export default function QuickSetup() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <PageHeader
        title="Command Activation"
        description="Deploy the NebulaMailCord hub to your server in under 120 seconds."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        {/* 1. Admin setup */}
        <SectionHeading id="admin-setup">Phase 1: Admin Initialization</SectionHeading>
        <p className="text-xl text-neutral-500 mb-10 font-medium">
          Deployment is streamlined through our advanced Discord Slash Command interface.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          {[
            { step: 'Invite', desc: 'Securely link the bot to your Discord instance.', icon: discordPng },
            { step: 'Deploy', desc: 'Run `/setup` to initialize the user hub panel.', icon: boltPng },
            { step: 'Authorize', desc: 'Verify role hierarchies and channel perms.', icon: verifyGif },
          ].map(({ step, desc, icon }, i) => (
            <div key={step} className="p-8 rounded-3xl bg-[#080808] border border-white/5 relative group overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500/10 group-hover:bg-indigo-500/40 transition-colors"></div>
              <div className="flex justify-between items-start mb-6">
                <div className="text-[10px] font-black text-neutral-700 uppercase tracking-widest">Step 0{i+1}</div>
                <img src={icon} alt={step} className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-white font-black text-xl mb-3 tracking-tighter">{step}</p>
              <p className="text-neutral-500 text-sm leading-relaxed font-medium">{desc}</p>
            </div>
          ))}
        </div>

        <CodeBlock code={`/setup      # Initializes the "Ghost Hub" panel`} language="bash" />

        {/* 2. User Setup */}
        <SectionHeading id="user-setup">Phase 2: The Onboarding Flow</SectionHeading>
        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] p-10 mb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5 blur-[80px] -z-10"></div>
          <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(99,102,241,0.3)] overflow-hidden">
                 <img src={verifyGif} alt="Verify" className="w-12 h-12 scale-125" />
              </div>
             <div>
                <p className="text-white font-black text-2xl mb-4 tracking-tighter">Frictionless Entry</p>
                <p className="text-neutral-400 font-medium leading-relaxed max-w-lg mb-6 text-lg">
                  When a user clicks <strong>"Create My Inbox"</strong>, Nebula automatically generates a private, secure category visible only to them and the bot. 
                </p>
                <Badge variant="indigo">No Complex Setup for Users</Badge>
             </div>
          </div>
        </div>

        {/* 🚨 ERROR HANDLING (CRITICAL) */}
        <SectionHeading id="errors">Protocol Resilience</SectionHeading>
        <p className="text-neutral-500 mb-8 font-medium italic">Resolving deployment bottlenecks with precision.</p>
        
        <div className="space-y-4 my-10">
          {[
            {
              err: 'Insufficient Administrator Credentials',
              cause: 'Missing "Manage Server" Discord permission.',
              fix: 'Request server ownership or a role with administrative bypass active.'
            },
            {
              err: 'Channel Creation Failure',
              cause: 'Bot role is positioned too low in the server hierarchy.',
              fix: 'Go to Settings → Roles and drag "NebulaMailCord" above all user roles.'
            },
            {
              err: 'Duplicate Inbox instance',
              cause: 'Active inbox category already exists for this user.',
              fix: 'Check the channel side-bar for "📧 [Name] Emails" or run !reset.'
            }
          ].map(({ err, cause, fix }) => (
            <div key={err} className="p-8 rounded-3xl border border-white/5 bg-[#080808]/50 backdrop-blur-sm group hover:border-red-500/20 transition-all">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <code className="text-white font-black text-sm uppercase tracking-tighter">{err}</code>
                  </div>
                  <Badge variant="neutral">Severity: High</Badge>
               </div>
               <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-neutral-700 text-[10px] uppercase font-black tracking-widest mb-1">Root Cause</p>
                    <p className="text-neutral-500 text-sm font-medium">{cause}</p>
                  </div>
                  <div>
                    <p className="text-emerald-500 text-[10px] uppercase font-black tracking-widest mb-1">Resolution</p>
                    <p className="text-neutral-300 text-sm font-bold">{fix}</p>
                  </div>
               </div>
            </div>
          ))}
        </div>

        {/* Pro Tips */}
        <Callout type="warning" title="Privacy Settings Notification">
           <strong>Critical:</strong> Many beginners forget to enable DMs. Without DMs, the bot cannot deliver secure system notifications. Advise your users to check User Settings → Privacy & Safety.
        </Callout>

        {/* Navigation */}
        <div className="mt-32 pt-10 border-t border-white/5 flex justify-between items-center">
          <Link to="/docs/how-it-works" className="px-8 py-4 rounded-2xl border border-white/5 text-neutral-500 font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
            Back: Architecture
          </Link>
          <Link to="/docs/alias-system" className="px-10 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/5 group flex items-center gap-2">
            Next: Alias Matrix <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
