import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, Callout, CodeBlock, SpecTable, DiscordMockup, Badge } from '../../components/docs/Shared';
import { HelpCircle, AlertCircle, ShieldAlert, MessageSquare, ArrowRight, Zap, Plus, Minus, MessageCircle, Shield, CreditCard, AlertTriangle, Ghost, Lock } from 'lucide-react';

// 🖼️ Custom Emoji Assets
import mailPng from '../../assets/docs/emojis/mail.png';
import boltPng from '../../assets/docs/emojis/bolt.png';
import verifyGif from '../../assets/docs/emojis/verify.gif';
import lockedPng from '../../assets/docs/emojis/locked.png';

export default function MessagingFlow() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <PageHeader
        title="Signal Routing"
        description="The mechanics of anonymous message delivery and secondary relay response."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        {/* 1. Simple Explanation */}
        <SectionHeading id="send">The Secure Relay</SectionHeading>
        <p className="text-xl text-neutral-500 mb-10 leading-relaxed font-medium">
          Message delivery in Nebula is handled via our **Pseudo-SMTP Relay**. Your command is caught, scrubbed of all PII (Personally Identifiable Information), and re-issued as an anonymous packet.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
            <HighlightCard title="Secure Dispatch" description="Message is encrypted and sent to the Nebula relay." icon={mailPng} />
            <HighlightCard title="Identity Scrubbing" description="All personal metadata is permanently removed." icon={lockedPng} />
            <HighlightCard title="Phantom Routing" description="Message is re-signed and delivered to the destination." icon={boltPng} />
        </div>

        {/* 2. 🧩 How it works (Standard format) */}
        <SectionHeading id="how-it-works">Packet Relay Flow</SectionHeading>
        <div className="bg-[#080808] border border-white/5 rounded-[3rem] p-12 mb-16 relative overflow-hidden group">
          <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] -z-10 group-hover:bg-indigo-500/10 transition-colors"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-white/5 shadow-2xl">
                 <CodeBlock code="!mail send ghost hi" language="bash" />
              </div>
              <p className="text-white font-black text-[10px] uppercase tracking-widest">Entry Signal</p>
            </div>

            <div className="flex flex-col items-center">
               <ArrowRight className="hidden md:block w-8 h-8 text-neutral-800 animate-pulse" />
               <div className="h-4 w-px bg-white/5 md:hidden"></div>
            </div>

            <div className="w-16 h-16 rounded-3xl bg-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.4)] relative">
              <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Zap className="w-8 h-8 text-white relative z-10" />
            </div>

            <div className="flex flex-col items-center">
               <ArrowRight className="hidden md:block w-8 h-8 text-neutral-800 animate-pulse" />
               <div className="h-4 w-px bg-white/5 md:hidden"></div>
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="bg-[#1e1f22] p-5 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-2xl"></div>
                 <p className="text-[#dbdee1] text-xs italic font-medium">"Message from @ghost: hi"</p>
              </div>
              <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">Relay Delivery</p>
            </div>
          </div>
          <p className="text-center text-neutral-600 text-xs mt-12 font-bold tracking-tight">Identity incineration complete. No metadata residual detected.</p>
        </div>

        {/* Sending Command */}
        <SectionHeading id="commands">Transmission Set</SectionHeading>
        <div className="space-y-4 mb-10">
           <CodeBlock code={`!mail send <target_alias> <message>      # Initiate Transmission\n!mail reply <message_id> <message>         # Secondary Relay Response`} language="bash" />
        </div>
        
        <DiscordMockup messages={[
          {
            user: 'GhostOperator',
            content: <code className="text-indigo-400 font-mono text-xs">!mail send admin "Reporting valid protocol breach in sector-7."</code>,
            time: '3:00 PM'
          },
          {
            user: 'NebulaMailCord',
            isBot: true,
            avatar: 'N',
            content: (
              <div className="bg-[#0f0f0f] border border-indigo-500/10 p-6 rounded-3xl shadow-3xl relative">
                 <div className="flex items-center gap-3 mb-4">
                    <Badge variant="indigo">Transmission Link Active</Badge>
                 </div>
                 <p className="text-white font-black text-sm tracking-tight mb-2">📬 Signal Reaching Destination</p>
                 <p className="text-neutral-500 text-[11px] font-medium leading-relaxed">External packet identified as <strong>@phantom</strong>. Tracking ID: <code className="text-indigo-300">MC-91X2-PLAT</code></p>
              </div>
            ),
            time: '3:01 PM'
          }
        ]} />

        <div className="grid md:grid-cols-2 gap-6 my-16">
          <HighlightCard 
            title="Bi-Directional Privacy" 
            description="Replies are automatically routed back through the same alias pipeline, maintaining anonymity for both parties." 
            icon={verifyGif} 
            variant="indigo" 
          />
          <HighlightCard 
            title="Real-time Synchronization" 
            description="Experience zero-latency delivery between Discord and the Nebula routing engine." 
            icon={boltPng} 
            variant="neutral" 
          />
        </div>

        {/* 🚨 ERROR HANDLING (CRITICAL) */}
        <SectionHeading id="errors">Relay Interference</SectionHeading>
        
        <div className="space-y-4 my-12">
          {[
            {
              err: 'Target Ghost Not Found',
              format: '!mail send ghost <msg>',
              cause: 'Target alias does not exist in the global index.',
              fix: 'Verify the recipient identifier or check for spelling entropy.'
            },
            {
              err: 'Null Signal Detected',
              format: '!mail send <alias> hi',
              cause: 'Message body contains 0 bytes of transmission text.',
              fix: 'Include a non-empty string in the message argument.'
            },
            {
              err: 'Protocol Mismatch',
              format: 'user@domain.com',
              cause: 'External SMTP forwarding attempted on a legacy plan.',
              fix: 'Upgrade to Platinum or Supreme for cross-domain email support.'
            }
          ].map(({ err, format, cause, fix }) => (
            <div key={err} className="p-8 rounded-[2rem] bg-[#080808]/50 border border-white/5 hover:border-red-500/20 transition-all group backdrop-blur-sm">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                   <AlertTriangle className="w-5 h-5 text-red-500" />
                   <code className="text-red-400 font-black text-sm uppercase tracking-tighter">{err}</code>
                 </div>
                 <Badge variant="neutral">Auto-Resolved: No</Badge>
               </div>
               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <div>
                      <p className="text-neutral-700 text-[10px] font-black uppercase tracking-widest mb-2">Signal Format</p>
                      <code className="text-indigo-400 text-xs font-mono">{format}</code>
                    </div>
                    <div>
                      <p className="text-neutral-700 text-[10px] font-black uppercase tracking-widest mb-2">Diagnosis</p>
                      <p className="text-neutral-500 text-xs leading-relaxed font-medium">{cause}</p>
                    </div>
                  </div>
                  <div className="bg-indigo-500/5 p-6 rounded-2xl border border-indigo-500/10">
                     <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2">Resolution Protocol</p>
                     <p className="text-neutral-300 text-sm font-bold leading-relaxed">{fix}</p>
                  </div>
               </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-32 pt-10 border-t border-white/5 flex justify-between items-center">
          <Link to="/docs/alias-system" className="px-8 py-4 rounded-2xl border border-white/5 text-neutral-500 font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
            Back: Alias Matrix
          </Link>
          <Link to="/docs/inbox" className="px-10 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/5 group flex items-center gap-2">
            Next: Inbox Hub <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
