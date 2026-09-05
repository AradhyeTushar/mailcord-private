import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, Callout, CodeBlock, SpecTable, DiscordMockup, Badge } from '../../components/docs/Shared';
import { User, Shield, Lock, RotateCcw, Trash2, ArrowRight, Zap, AlertTriangle, Info } from 'lucide-react';

// 🖼️ Custom Emoji Assets
import starPng from '../../assets/docs/emojis/star.png';
import lockedPng from '../../assets/docs/emojis/locked.png';
import unlockedPng from '../../assets/docs/emojis/unlocked.png';
import verifyGif from '../../assets/docs/emojis/verify.gif';
import proPng from '../../assets/docs/emojis/pro.png';
import discordPng from '../../assets/docs/emojis/discord.png';

export default function AliasSystem() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <PageHeader
        title="Alias Matrix"
        description="The engine of pseudonymity. Generate and rotate cryptographic identities."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        {/* 1. Simple Explanation */}
        <SectionHeading id="simple">The Alias Protocol</SectionHeading>
        <p className="text-xl text-neutral-500 mb-10 leading-relaxed font-medium transition-colors hover:text-neutral-400">
          An **Alias** is a virtual persona that sits between your real Discord ID and the outside world. It maps your incoming mail to a private hub while providing a shield for your personal profile.
        </p>

        {/* 2. 🧩 How it works (Standard format) */}
        <SectionHeading id="how-it-works">Identity Life Cycle</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 my-10">
          {[
            { n: 1, action: 'Identity Anchor', desc: 'Your global recovery hash is generated.', icon: starPng },
            { n: 2, action: 'Category Shield', desc: 'Secure Discord category is provisioned.', icon: lockedPng },
            { n: 3, action: 'Alias Binding', desc: 'Your first phantom identity is minted.', icon: unlockedPng },
            { n: 4, action: 'Relay Active', desc: 'Ready for traffic', icon: RotateCcw },
          ].map(({ n, action, desc, icon: Icon }) => (
            <div key={n} className="p-6 rounded-3xl bg-[#080808] border border-white/5 text-center group hover:border-indigo-500/30 transition-all duration-500">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto mb-4 border border-white/5 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all">
                {typeof Icon === 'string' ? <img src={Icon} alt={action} className="w-6 h-6" /> : <Icon className="w-5 h-5 text-indigo-400" />}
              </div>
              <p className="text-white font-black text-xs uppercase tracking-tighter mb-1">{action}</p>
              <p className="text-neutral-600 text-[10px] font-bold uppercase tracking-widest">Phase {n}</p>
            </div>
          ))}
        </div>

        {/* 3. Real Examples */}
        <SectionHeading id="examples">Activation Command</SectionHeading>
        <CodeBlock code={`/alias create name:ghost    # Shortcut: !alias create ghost`} language="bash" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
          <HighlightCard 
            title="Full Ownership" 
            description="Transfer aliases between users or move them across servers without losing history." 
            icon={verifyGif} 
            variant="indigo" 
          />
          <HighlightCard 
            title="Management Matrix" 
            description="Toggle privacy, lock aliases, or export data with advanced admin commands." 
            icon={proPng} 
            variant="neutral" 
          />
        </div>

        <DiscordMockup messages={[
          {
            user: 'SecuritySpecialist',
            content: <code className="text-indigo-300 font-mono text-xs">/alias create name:phantom</code>,
            time: '2:00 PM'
          },
          {
            user: 'NebulaMailCord',
            isBot: true,
            avatar: 'N',
            content: (
              <div className="bg-[#0f0f0f] border border-emerald-500/10 p-5 rounded-2xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors"></div>
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                      <Shield className="w-4 h-4 text-emerald-400" />
                   </div>
                   <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Protocol Verified</p>
                </div>
                <p className="text-white font-black text-sm mb-1">Identity: <code className="text-indigo-400">phantom@mailcord.uk</code></p>
                <p className="text-neutral-500 text-[10px] font-medium italic">Use !mail send phantom to initialize communication.</p>
              </div>
            ),
            time: '2:00 PM'
          }
        ]} />

        {/* 4. Common Commands */}
        <SectionHeading id="commands">Alias Management Matrix</SectionHeading>
        <SpecTable 
          headers={['Command Set', 'Operation', 'Legacy Shortcut']}
          rows={[
            ['/alias create', 'Initialize identity', '!alias create <name>'],
            ['/alias list', 'View active vault', '!al'],
            ['/alias info', 'Telemetry data', '!ai <name>'],
            ['/alias delete', 'Identity sunset', '!ad <name>'],
            ['/alias recover', 'Restore (7 days)', '!alias recover <name>'],
          ]}
        />

        {/* 🚨 ERROR HANDLING (CRITICAL) */}
        <SectionHeading id="errors">Matrix Resilience</SectionHeading>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-10">
          {[
            {
              err: 'Invalid String Length',
              cause: 'Alias name must be 3-30 chars.',
              fix: 'Restrict name to alpha-numeric strings between 3 and 30 characters.'
            },
            {
              err: 'Identity Collision',
              cause: 'This alias is already claimed by another user.',
              fix: 'Choose a unique identifier or append numeric entropy (e.g., ghost-99).'
            },
            {
              err: 'Recovery Lock',
              cause: 'Alias is in the 7-day shadow recovery period.',
              fix: 'Wait for the window to close or use /alias recover if you owned it.'
            },
            {
              err: 'Throughput Limit',
              cause: 'Rate limit: Exceeded creation window.',
              fix: 'Wait 60 seconds. Premium tiers offer high-throughput creation.'
            }
          ].map(({ err, cause, fix }) => (
            <div key={err} className="p-6 rounded-3xl bg-[#080808]/50 border border-white/5 hover:border-red-500/20 transition-all group">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <code className="text-red-400 font-black text-[10px] uppercase tracking-tighter">{err}</code>
              </div>
              <p className="text-neutral-500 text-[11px] font-medium mb-3"><strong>Cause:</strong> {cause}</p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-emerald-400 text-[11px] font-bold"><strong>Fix:</strong> {fix}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tip */}
        <Callout type="warning" title="Identity Persistence">
           When you sunset an Alias, it remains locked to your vault ID for <strong>7 days</strong>. This prevents identity squatting and allows for accidental deletion recovery. After this window, the ghost is released back to the global pool.
        </Callout>

        {/* Navigation */}
        <div className="mt-32 pt-10 border-t border-white/5 flex justify-between items-center">
          <Link to="/docs/setup" className="px-8 py-4 rounded-2xl border border-white/5 text-neutral-500 font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
            Back: Activation
          </Link>
          <Link to="/docs/messaging-flow" className="px-10 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/5 group flex items-center gap-2">
            Next: Signal Flow <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
