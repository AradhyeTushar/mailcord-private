import React from 'react';
import { Link } from 'react-router-dom';
import { SectionHeading, HighlightCard, HeroGrid, Badge } from '../../components/docs/Shared';
import { Mail, Reply, Globe, Shield, Zap, ArrowRight, Play } from 'lucide-react';

// 🖼️ Custom Emoji Assets
import verifyGif from '../../assets/docs/emojis/verify.gif';
import mailPng from '../../assets/docs/emojis/mail.png';
import boltPng from '../../assets/docs/emojis/bolt.png';
import verifiedStaticPng from '../../assets/docs/emojis/verified-static.png';
import websitePng from '../../assets/docs/emojis/website.png';
import starPng from '../../assets/docs/emojis/star.png';
import billingPng from '../../assets/docs/emojis/billing.png';

export default function Introduction() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 -mt-12">
      {/* 🌌 Phase 1: Full-screen Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden rounded-[3rem] nebula-animate border border-white/5 mb-24">
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="p-12 md:p-20 rounded-[4rem] glass-hero shadow-2xl relative group border border-white/10">
            <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="flex justify-center mb-6">
               <img src={starPng} alt="Star" className="w-12 h-12 animate-pulse" />
            </div>
            
            <Badge variant="indigo">
              <div className="flex items-center gap-2">
                <img src={verifiedStaticPng} alt="Verified" className="w-4 h-4" />
                Welcome to the Future
              </div>
            </Badge>
            
            <h1 className="text-6xl md:text-8xl font-black text-white mt-8 mb-8 tracking-tighter-extreme leading-[0.85] text-balance">
              Email<span className="text-indigo-500">.</span><br />
              <span className="text-neutral-500 flex items-center justify-center gap-4">
                Reimagined for 
                <img src={boltPng} alt="Bolt" className="w-16 h-16 inline-block animate-bounce" />
              </span> 
              Discord<span className="text-indigo-500">.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-neutral-400 font-medium leading-relaxed max-w-2xl mx-auto mb-12 text-balance">
              MailCord transforms your Discord server into a fully functional email system — fast, secure, and built for modern communities.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                to="/docs/setup" 
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-3 group"
              >
                Get Started <Zap className="w-4 h-4 group-hover:fill-current" />
              </Link>
              <Link 
                to="/docs/introduction" 
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-neutral-900/50 border border-white/10 text-white font-black text-sm uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 group"
              >
                View Docs <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/10 flex justify-center p-1">
             <div className="w-1 h-2 bg-indigo-500 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* 🧊 Phase 2: Feature Bento Grid */}
      <div className="max-w-6xl mx-auto px-4">
        <SectionHeading id="features">Protocol Capabilities</SectionHeading>
        <p className="text-xl text-neutral-500 mb-12 max-w-2xl font-medium">Standard features built for high-throughput communities.</p>
        
        <HeroGrid>
          <div className="md:col-span-2">
            <HighlightCard 
              title="📩 Instant Delivery" 
              description="Receive emails directly inside Discord with rich embeds, real-time attachment previews, and full markdown support." 
              icon={mailPng} 
              variant="indigo" 
            />
          </div>
          <HighlightCard 
            title="🔁 Native Reply" 
            description="Respond to threads instantly—no inbox switching required." 
            icon={boltPng} 
            variant="neutral" 
          />
          <HighlightCard 
            title="🌐 Custom Domains" 
            description="Link your own domain for a professional experience." 
            icon={websitePng} 
            variant="neutral" 
          />
          <div className="md:col-span-2">
            <HighlightCard 
              title="🛡️ Enterprise Security" 
              description="Built with military-grade token systems, advanced rate limits, and full process isolation layers for every community." 
              icon={verifyGif} 
              variant="indigo" 
            />
          </div>
        </HeroGrid>

        {/* 💎 Phase 3: Value Section (Glass Panel) */}
        <section className="my-32">
          <div className="p-12 md:p-20 rounded-[4rem] glass border border-white/5 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] -z-10 group-hover:bg-indigo-500/10 transition-colors duration-1000"></div>
            <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-white/10 flex items-center justify-center mx-auto mb-10 shadow-3xl">
              <Zap className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter leading-tight max-w-3xl mx-auto">
              More than a bot. <br />
              <span className="text-neutral-500">A communication infrastructure layer.</span>
            </h2>
            <p className="text-xl text-neutral-500 font-medium max-w-2xl mx-auto mb-12">
              MailCord isn't just a utility — it is the backbone of modern community engagement, bridging the gap between legacy email and modern real-time chat.
            </p>
            <Badge variant="indigo">Deep Real-World Integration</Badge>
          </div>
        </section>

        {/* Global Footer Navigation */}
        <div className="mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 pb-20">
          <p className="text-neutral-600 text-xs font-black uppercase tracking-[0.2em]">© 2024 Nebula Technologies</p>
          <div className="flex gap-4">
             <Link to="/docs/how-it-works" className="px-10 py-4 rounded-full bg-neutral-900 border border-white/5 text-white font-black text-xs hover:bg-neutral-800 transition-all flex items-center gap-2 group">
                Deep Dive <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
