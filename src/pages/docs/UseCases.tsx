import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, Callout, Badge } from '../../components/docs/Shared';
import { Shield, Users, Trophy, Heart, Building2, MessageSquare, ArrowRight } from 'lucide-react';

const CaseCard = ({ icon: Icon, title, category, flow, cmd, result, color }: any) => (
  <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all group h-full flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <Badge variant="neutral">{category}</Badge>
        <h3 className="text-white font-bold text-lg mt-1">{title}</h3>
      </div>
    </div>
    
    <div className="flex-1">
      <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-3">🧩 The Flow</p>
      <div className="text-neutral-300 text-sm leading-relaxed mb-6 border-l-2 border-neutral-800 pl-4 py-1 italic">
        {flow}
      </div>

      <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-3">🚀 Key Command</p>
      <code className="block bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-indigo-300 text-xs font-mono mb-6">
        {cmd}
      </code>
    </div>

    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-neutral-800/50">
      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
      <p className="text-emerald-400 text-xs font-bold">{result}</p>
    </div>
  </div>
);

export default function UseCases() {
  const cases = [
    {
      icon: Shield,
      title: 'Anonymous HR Reports',
      category: 'Enterprise',
      color: 'bg-indigo-500/10 text-indigo-400',
      flow: 'Employee → Creates Alias → Sends report to HR inbox → Identity is scrubbed → HR responds without knowing who sent it.',
      cmd: '!mail send hr-team I want to report a concern...',
      result: 'Safe reports without retaliation.'
    },
    {
      icon: Trophy,
      title: 'Esports Trial Systems',
      category: 'Gaming',
      color: 'bg-amber-500/10 text-amber-400',
      flow: 'Player → Joins server → Receives trial alias #01 → Submits stats → Coaches eval skill purely on data.',
      cmd: '!mail send coach Match result: 30-2 K/D.',
      result: 'Bias-free recruitment process.'
    },
    {
      icon: Heart,
      title: 'Support Confessions',
      category: 'Community',
      color: 'bg-rose-500/10 text-rose-400',
      flow: 'User → Opens anonymous support thread → Shares mental health struggle → Mod provides care → Total privacy.',
      cmd: '!alias create support-anon',
      result: 'Safe space for vulnerable sharing.'
    },
    {
      icon: MessageSquare,
      title: 'Server Staff Q&A',
      category: 'Governance',
      color: 'bg-emerald-500/10 text-emerald-400',
      flow: 'Member → Asks "dumb" question anonymously → Owner replies to alias ID → Everyone learns without shame.',
      cmd: '!mail reply MC-XXXX Answered.',
      result: 'Higher engagement in Q&A events.'
    }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <PageHeader
        title="Real Use Cases"
        description="See how NebulaMailCord solves identity problems in the real world."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        <SectionHeading id="intro">How to build a Use Case?</SectionHeading>
        <p className="text-lg text-neutral-300 mb-12 leading-relaxed italic">
          "Don't just send messages. Build a system where identity removal creates safety and fairness."
        </p>

        <div className="grid md:grid-cols-2 gap-6 my-12">
          {cases.map(c => <CaseCard key={c.title} {...c} />)}
        </div>

        <SectionHeading id="tips">🧩 The "Beginner" Tip</SectionHeading>
        <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 flex gap-6 items-center">
           <div className="w-16 h-16 rounded-full bg-neutral-950 border border-white/5 flex items-center justify-center shrink-0">
              <Building2 className="w-8 h-8 text-indigo-400" />
           </div>
           <div>
              <p className="text-white font-bold mb-2">Creating a Report System?</p>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Admins should create a shared alias like <strong>@report-team</strong>. Tell users to message that alias. This creates a centralized moderation queue that all staff can see in the #inbox.
              </p>
           </div>
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-800 flex justify-between items-center">
          <Link to="/docs/admin-guide" className="px-6 py-3 rounded-2xl border border-neutral-800 text-neutral-400 font-bold hover:bg-neutral-900 transition-all flex items-center gap-2">
            Back: Admin Guide
          </Link>
          <Link to="/docs/bot-workflows" className="px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 group flex items-center gap-2">
            Next: Bot Workflows <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
