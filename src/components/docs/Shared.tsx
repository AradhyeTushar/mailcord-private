import React, { useState, useEffect } from 'react';
import { Check, Copy, Info, AlertTriangle, CheckCircle2, Hash, ArrowRight, Zap } from 'lucide-react';

export const Callout = ({ type, title, children }: { type: 'info' | 'warning' | 'success', title?: string, children: React.ReactNode }) => {
  const styles = {
    info: 'bg-indigo-500/5 border-indigo-500/10 text-neutral-400',
    warning: 'bg-amber-500/5 border-amber-500/10 text-neutral-400',
    success: 'bg-emerald-500/5 border-emerald-500/10 text-neutral-400'
  };
  const icons = {
    info: <Info className="w-5 h-5 text-indigo-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
  };

  return (
    <div className={`p-6 rounded-2xl border flex gap-4 my-8 backdrop-blur-md ${styles[type]}`}>
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        {title && <h4 className="font-bold mb-1 text-white text-sm tracking-tight">{title}</h4>}
        <div className="text-sm leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
};

export const CodeBlock = ({ code, language = 'bash', inline = false }: { code: string, language?: string, inline?: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-neutral-900 border border-white/5 rounded-md px-2 py-0.5 text-xs font-mono text-indigo-300">
        {code}
        <button onClick={handleCopy} className="text-neutral-600 hover:text-white transition-colors" title="Copy">
          {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
        </button>
      </span>
    );
  }

  return (
    <div className="relative group my-8">
      <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={handleCopy}
          className="p-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="absolute inset-0 bg-indigo-500/5 blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
      <pre className="bg-[#080808] border border-white/5 rounded-2xl p-6 overflow-x-auto no-scrollbar relative shadow-xl">
        <div className="flex gap-1.5 mb-4 border-b border-white/5 pb-4 -mx-6 px-6">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
          <span className="ml-2 text-[10px] text-neutral-600 font-bold uppercase tracking-widest">{language}</span>
        </div>
        <code className="text-[13px] font-mono leading-relaxed text-neutral-400 block pb-2">{code}</code>
      </pre>
    </div>
  );
};

export const Step = ({ number, title, children, isLast = false }: { number: number | string, title: string, children: React.ReactNode, isLast?: boolean }) => (
  <div className="flex gap-6 relative">
    {!isLast && <div className="absolute left-[15px] top-10 bottom-[-2.5rem] w-0.5 bg-gradient-to-b from-indigo-500/20 to-transparent z-0"></div>}
    <div className="shrink-0 w-8 h-8 rounded-xl bg-neutral-900 text-indigo-400 flex items-center justify-center font-bold border border-white/5 z-10 mt-1 shadow-lg shadow-black/50">
      {number}
    </div>
    <div className="pb-10 overflow-hidden flex-1">
      <h4 className="text-xl font-bold mb-3 text-white tracking-tight">{title}</h4>
      <div className="text-neutral-500 text-sm leading-relaxed">{children}</div>
    </div>
  </div>
);

export const Badge = ({ children, variant = 'neutral' }: { children: React.ReactNode, variant?: 'neutral' | 'indigo' | 'emerald' | 'amber' | 'purple' }) => {
  const variants = {
    neutral: 'bg-neutral-900 text-neutral-500 border-white/5',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-lg shadow-indigo-500/10',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${variants[variant]}`}>
      {children}
    </span>
  );
};

export const HighlightCard = ({ title, description, icon: Icon, variant = 'neutral' }: { title: string, description: string, icon: any, variant?: 'neutral' | 'indigo' | 'emerald' }) => {
  const variants = {
    neutral: 'border-white/5 hover:border-white/10 bg-[#0a0a09]/50 shadow-2xl',
    indigo: 'border-indigo-500/10 hover:border-indigo-500/20 bg-indigo-500/5',
    emerald: 'border-emerald-500/10 hover:border-emerald-500/20 bg-emerald-500/5',
  };
  return (
    <div className={`p-8 rounded-3xl border transition-all duration-500 group relative overflow-hidden backdrop-blur-sm ${variants[variant]}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors duration-500"></div>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#080808] border border-white/5 flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 group-hover:border-indigo-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5 blur-xl"></div>
          {typeof Icon === 'string' ? (
            <img src={Icon} alt="icon" className="w-10 h-10 object-contain relative z-10" />
          ) : (
            <Icon className="w-8 h-8 text-indigo-400 relative z-10" />
          )}
        </div>
      )}
      <h3 className="text-xl font-black text-white mb-3 tracking-tighter">{title}</h3>
      <p className="text-sm text-neutral-500 leading-relaxed font-medium">{description}</p>
    </div>
  );
};

export const SpecTable = ({ headers, rows }: { headers: string[], rows: any[][] }) => (
  <div className="my-10 overflow-x-auto border border-white/5 rounded-3xl bg-[#080808]/50 backdrop-blur-md shadow-2xl">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-neutral-900/30 border-b border-white/5">
          {headers.map((h, i) => (
            <th key={i} className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {rows.map((row, i) => (
          <tr key={i} className="hover:bg-white/5 transition-colors group">
            {row.map((cell, j) => (
              <td key={j} className="px-6 py-4 text-sm text-neutral-400 font-mono transition-colors group-hover:text-white">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const DiscordMockup = ({ messages }: { messages: { user: string, avatar?: string, time?: string, content: React.ReactNode, isBot?: boolean }[] }) => (
  <div className="my-10 bg-[#313338] rounded-3xl overflow-hidden border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
    <div className="px-6 py-3 bg-[#2b2d31] border-b border-black/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#ed4245]"></div>
        <div className="w-3 h-3 rounded-full bg-[#f0871d]"></div>
        <div className="w-3 h-3 rounded-full bg-[#23a559]"></div>
        <span className="text-[11px] text-neutral-500 font-black ml-4 uppercase tracking-[0.2em]">Live Preview</span>
      </div>
      <div className="w-20 h-1.5 bg-black/20 rounded-full"></div>
    </div>
    <div className="p-6 space-y-6">
      {messages.map((m, i) => (
        <div key={i} className="flex gap-4 group">
          <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-white font-black text-base shadow-lg ${m.isBot ? 'bg-[#5865f2] rotate-3' : 'bg-[#1e1f22] -rotate-3 hover:rotate-0 transition-transform cursor-pointer'}`}>
            {m.avatar || m.user[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`font-bold text-sm tracking-tight ${m.isBot ? 'text-white' : 'text-[#f2f3f5]'}`}>{m.user}</span>
              {m.isBot && <span className="bg-[#5865f2] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-tight">BOT</span>}
              <span className="text-[10px] text-neutral-500 font-medium">{m.time || 'Today AT 12:00 PM'}</span>
            </div>
            <div className="text-[#dbdee1] text-sm leading-relaxed break-words whitespace-pre-wrap font-medium">
              {m.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SectionHeading = ({ id, children }: { id: string, children: React.ReactNode }) => (
  <h2 id={id} className="text-3xl font-black mt-24 mb-8 text-white flex items-center gap-3 group scroll-mt-48 tracking-tighter">
    {children}
    <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 transition-all text-neutral-700 hover:text-indigo-400 -translate-x-2 group-hover:translate-x-0">
      <Hash className="w-6 h-6" />
    </a>
  </h2>
);

export const PageHeader = ({ title, description, lastUpdated }: { title: string, description: string, lastUpdated?: string }) => {
  return (
    <div className="mb-20 pt-10">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6">
        <Zap className="w-3.5 h-3.5" /> Documentation v2.1
      </div>
      <h1 className="text-7xl font-black mb-8 text-white tracking-tighter leading-[0.9] text-balance">
        {title}<span className="text-indigo-500">.</span>
      </h1>
      <p className="text-2xl text-neutral-500 leading-relaxed font-medium max-w-2xl text-balance">{description}</p>
      
      {lastUpdated && (
        <div className="flex items-center gap-3 mt-10 p-1.5 pl-4 pr-3 bg-[#080808] border border-white/5 rounded-2xl w-fit group cursor-help transition-all hover:border-emerald-500/20">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Safe Coverage</span>
          <Badge variant="emerald">Live: {lastUpdated}</Badge>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        </div>
      )}
    </div>
  );
};

// New Premium Component: HeroGrid
export const HeroGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-16">
    {children}
  </div>
);
