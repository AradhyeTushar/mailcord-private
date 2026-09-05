import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, DiscordMockup, Badge } from '../../components/docs/Shared';
import { ShieldAlert, UserCheck, MailQuestion, MessageCircle, ArrowRight, Zap, Ghost } from 'lucide-react';

// 🖼️ Custom Emoji Assets
import mailPng from '../../assets/docs/emojis/mail.png';
import lockedPng from '../../assets/docs/emojis/locked.png';
import verifiedPng from '../../assets/docs/emojis/verified-static.png';
import verifyGif from '../../assets/docs/emojis/verify.gif';
import starPng from '../../assets/docs/emojis/star.png';

export default function HowItWorks() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <PageHeader
        title="Privacy Architecture"
        description="A technical exploration of the Nebula routing system and identity destruction."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        {/* 1. Simple Summary */}
        <SectionHeading id="summary">The Ghost Protocol</SectionHeading>
        <p className="text-xl text-neutral-500 mb-10 leading-relaxed font-medium">
          NebulaMailCord doesn't just hide your name; it <strong>incinerates</strong> the connection between your message and your Discord profile.
        </p>

        {/* 2. The 4-Step Pipeline */}
        <SectionHeading id="pipeline">4-Step Identity Destruction</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
          {[
            { n: 1, title: 'Identity Capture', desc: 'Securely map your request to your global Alias Vault.', icon: starPng, color: 'text-indigo-400' },
            { n: 2, title: 'Metadata Incineration', desc: 'Removing your Avatar URL, Display Name, and Discord ID from the packet.', icon: lockedPng, color: 'text-amber-400' },
            { n: 3, title: 'Phantom Signature', desc: 'Re-signing the message with your chosen alias signature.', icon: verifiedPng, color: 'text-emerald-400' },
            { n: 4, title: 'Secure Handshake', desc: 'Delivering the message to the recipient\'s private inbox category.', icon: mailPng, color: 'text-indigo-400' },
          ].map(({ n, title, desc, icon, color }) => (
            <div key={n} className="p-8 rounded-[2rem] bg-[#080808] border border-white/5 hover:border-indigo-500/20 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-colors"></div>
              <div className="flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 overflow-hidden">
                  <img src={icon} alt={title} className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="neutral">Phase {n}</Badge>
                    <p className="text-white font-black text-lg tracking-tight">{title}</p>
                  </div>
                  <p className="text-neutral-500 text-sm leading-relaxed font-medium">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Visual Example */}
        <SectionHeading id="visual">Protocol Visualization</SectionHeading>
        <p className="text-neutral-500 mb-6 font-medium">How the bot responds to your commands in real-time.</p>
        <DiscordMockup messages={[
          {
            user: 'RealIdentity',
            content: <code className="text-indigo-300 font-mono text-xs">!mail send ghost "Hello, this is a secure transmission."</code>,
            time: '12:00 PM'
          },
          {
            user: 'NebulaMailCord',
            isBot: true,
            avatar: 'N',
            content: (
              <div className="bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest">Secure</div>
                <p className="text-white font-black text-sm mb-2 flex items-center gap-2">
                   <Zap className="w-4 h-4 text-indigo-400" /> Protocol Active
                </p>
                <p className="text-neutral-400 text-xs">Message scrubbed and delivered. Recipient sees <strong>@ghost</strong>.</p>
                <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-neutral-600 font-bold font-mono">
                   PACKET_ID: NEB-9912-XTX | ROUTE: SECURE_RELAY
                </div>
              </div>
            ),
            time: '12:05 PM'
          }
        ]} />

        {/* 4. Use Case: Why this matters */}
        <SectionHeading id="use-cases">Why Security Matters</SectionHeading>
        <div className="grid md:grid-cols-2 gap-6">
          <HighlightCard 
            title="Safe Reporting" 
            description="Submit feedback to server staff without fear of retaliation or social pressure." 
            icon={lockedPng} 
            variant="neutral" 
          />
          <HighlightCard 
            title="Professional Trials" 
            description="Recruit based on performance alone, removing identity bias from your community." 
            icon={verifiedPng} 
            variant="neutral" 
          />
        </div>

        {/* Navigation */}
        <div className="mt-32 pt-10 border-t border-white/5 flex justify-between items-center">
          <Link to="/docs/introduction" className="px-8 py-4 rounded-2xl border border-white/5 text-neutral-500 font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
            Genesis
          </Link>
          <Link to="/docs/setup" className="px-10 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/5 group flex items-center gap-2">
            Next: Activation <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
