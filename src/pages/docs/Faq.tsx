import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, Callout, Badge, HighlightCard } from '../../components/docs/Shared';
import { HelpCircle, AlertCircle, ShieldAlert, MessageSquare, ArrowRight, Zap, Plus, Minus, AlertTriangle, Lock } from 'lucide-react';

// 🖼️ Custom Emoji Assets
import verifyGif from '../../assets/docs/emojis/verify.gif';
import boltPng from '../../assets/docs/emojis/bolt.png';
import billingPng from '../../assets/docs/emojis/billing.png';
import starPng from '../../assets/docs/emojis/star.png';

const FaqItem = ({ question, answer, icon: Icon }: { question: string, answer: React.ReactNode, icon: any }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className={`border-b border-white/5 last:border-0 transition-all ${isOpen ? 'bg-white/5' : ''}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-10 px-6 text-left hover:bg-white/5 transition-all group"
      >
        <div className="flex items-center gap-6">
           <div className={`p-4 rounded-2xl border border-white/5 bg-[#080808] transition-all group-hover:scale-110 ${isOpen ? 'bg-indigo-500 shadow-xl shadow-indigo-500/20' : ''}`}>
              <Icon className={`w-5 h-5 transition-colors ${isOpen ? 'text-white' : 'text-neutral-600 group-hover:text-indigo-400'}`} />
           </div>
           <span className={`text-xl font-black tracking-tight transition-colors ${isOpen ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'}`}>{question}</span>
        </div>
        <div className="p-2 rounded-full bg-white/5 transition-transform duration-500" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
           {isOpen ? <Minus className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-neutral-600" />}
        </div>
      </button>
      {isOpen && (
        <div className="pb-10 px-24 animate-in fade-in slide-in-from-top-4 duration-500">
          <p className="text-neutral-500 text-lg leading-relaxed font-medium">{answer}</p>
        </div>
      )}
    </div>
  );
};

export default function Faq() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <PageHeader
        title="Knowledge Base"
        description="The central intelligence hub for Nebula protocol operations and security."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        <div className="mt-12 rounded-[3.5rem] bg-[#080808] border border-white/5 overflow-hidden shadow-3xl">
          <HighlightCard 
            title="Can I use custom domains?" 
            description="Yes! Higher-tier plans allow you to link custom domains like team@community.com for a professional brand." 
            icon={billingPng} 
            variant="neutral" 
          />
          <HighlightCard 
            title="How do I get support?" 
            description="We offer 24/7 technical assistance for enterprise partners through our dedicated support hub." 
            icon={starPng} 
            variant="neutral" 
          />
          <FaqItem 
            icon={ShieldAlert}
            question="Is the Ghost Protocol absolutely anonymous?" 
            answer="For standard users, yes. Your real identity is never exposed in transit. However, to maintain community standards, server administrators have Deanonymization access. We believe in providing privacy for individuals and safety for communities." 
          />
          <FaqItem 
            icon={HelpCircle}
            question="Can I transport my alias between sectors?" 
            answer="Yes. Your Aliases are linked to your Global Vault ID. Once you claim '@ghost', it is yours across all Discord servers that have NebulaMailCord active." 
          />
          <FaqItem 
            icon={AlertCircle}
            question="Where is my private #inbox channel?" 
            answer="The inbox category is generated on-demand. Simply trigger the 'Create My Inbox' handshake in the primary #setup channel. If it fails to appear, ensure the bot has 'Manage Channels' permission in the server hierarchy." 
          />
          <FaqItem 
            icon={Zap}
            question="What happens when I sunset an identity?" 
            answer="The alias enters a 7-day shadow period. It remains linked to your ID, preventing others from squatting on the name while giving you a window for accidental deletion recovery." 
          />
          <HighlightCard 
            title="Is it truly anonymous?" 
            description="Nebula scrubs all Discord metadata at the byte level. Owners cannot track aliases without server-wide audit logs enabled." 
            icon={verifyGif} 
            variant="indigo" 
          />
          <HighlightCard 
            title="How fast is delivery?" 
            description="Our Pseudo-SMTP relay operates with sub-200ms latency, ensuring your messages feel instant." 
            icon={boltPng} 
            variant="neutral" 
          />
          <FaqItem 
            icon={MessageSquare}
            question="Is there support for multimedia transmission?" 
            answer="Currently, the protocol is restricted to text and markdown-based signals. Support for secure file and image relay is currently in the late-stage development pipeline." 
          />
        </div>

        {/* 🚨 QUICK FIXES */}
        <SectionHeading id="critical-errors">Common Diagnosis Fixes</SectionHeading>
        <div className="grid md:grid-cols-2 gap-8 my-16">
           <div className="p-10 rounded-[2.5rem] bg-[#080808] border border-white/5 group hover:border-indigo-500/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <AlertTriangle className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-white font-black text-2xl mb-4 tracking-tighter uppercase leading-[0.9]">Signal Mismatch</p>
              <p className="text-neutral-500 text-sm font-medium leading-relaxed">Ensure you are using the correct command format. Most 'Invalid Command' errors are caused by missing sub-commands (e.g., using <code>!alias</code> without <code>create</code>).</p>
           </div>
           <div className="p-10 rounded-[2.5rem] bg-[#080808] border border-white/5 group hover:border-emerald-500/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-white font-black text-2xl mb-4 tracking-tighter uppercase leading-[0.9]">Handshake Block</p>
              <p className="text-neutral-500 text-sm font-medium leading-relaxed">If the bot cannot message you privately, check your 'User Settings → Privacy & Safety' and ensure 'Allow Direct Messages' is toggled ON for server members.</p>
           </div>
        </div>

        <Callout type="info" title="Additional Support Phase">
          If you require a manual protocol override or have high-level security concerns, join our <a href="#" className="text-indigo-400 font-bold hover:underline">Platinum Support Grid</a> or transmit an email to <code>operations@nebula.app</code>.
        </Callout>

        {/* Final CTA */}
        <div className="mt-32 pt-20 border-t border-white/5 text-center">
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-10">End of Documentation</p>
          <Link to="/docs/introduction" className="inline-flex items-center gap-4 px-16 py-6 rounded-[2rem] bg-indigo-500 text-white font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-indigo-500/30 group">
             Re-Initialize Genesis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
