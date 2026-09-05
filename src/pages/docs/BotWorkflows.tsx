import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, Callout, CodeBlock, SpecTable, Badge, DiscordMockup } from '../../components/docs/Shared';
import { Zap, Filter, MessageSquare, AlertTriangle, ArrowRight, Info, Webhook } from 'lucide-react';

export default function BotWorkflows() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <PageHeader
        title="Bot Workflows"
        description="Automate your anonymous communication with filters, webhooks, and routing rules."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        {/* 1. Simple Explanation */}
        <SectionHeading id="simple">What are Workflows?</SectionHeading>
        <p className="text-lg text-neutral-300 mb-6 leading-relaxed">
          Workflows allow you to <strong>automate</strong> how messages are handled. Instead of reading every message manually, you can set "Filters" to flag urgent words or "Webhooks" to send messages to other apps like Slack or Notion.
        </p>

        {/* 2. 🧩 How it works (Standard format) */}
        <SectionHeading id="how-it-works">🧩 How Filtering Works</SectionHeading>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 mb-12">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center">
                 <p className="text-white font-bold text-xs mb-2">1. Set Rule</p>
                 <code className="text-[10px] text-indigo-400">!filter add ghost urgent</code>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-neutral-800 shrink-0" />
              <div className="flex-1 text-center">
                 <p className="text-white font-bold text-xs mb-2">2. Bot Scans</p>
                 <p className="text-neutral-500 text-[10px]">Scans incoming text</p>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-neutral-800 shrink-0" />
              <div className="flex-1 text-center">
                 <p className="text-white font-bold text-xs mb-2">3. Action Taken</p>
                 <p className="text-emerald-400 text-[10px] font-bold">Message Pinned/Flagged</p>
              </div>
           </div>
        </div>

        {/* Commands */}
        <SectionHeading id="commands">Common Workflow Commands</SectionHeading>
        <SpecTable 
          headers={['Command', 'Shortcut', 'What It Does']}
          rows={[
            ['!filter add <name> <word>', '!fa', 'Flag emails containing this keyword'],
            ['!filter add <name> -<word>', '!fa', 'Auto-delete emails containing this word'],
            ['!filter list <name>', '!fl', 'Show all active rules for an alias'],
            ['!alias webhook <name> <url>', '—', 'Forward all mail to a web URL (Slack/Zapier)'],
          ]}
        />

        {/* 🚨 ERROR HANDLING (CRITICAL) */}
        <SectionHeading id="errors">🚨 ERROR HANDLING (CRITICAL)</SectionHeading>
        
        <div className="space-y-4 my-8">
          {[
            {
              err: '"MailCord Pro Required: Filtering is premium."',
              cause: 'You tried to add a filter but are on the Free plan.',
              fix: 'Upgrade to Premium or Supreme to unlock automated keyword filtering.'
            },
            {
              err: '"Invalid URL format for webhook."',
              cause: 'The URL provided to `!alias webhook` is missing "https://" or is typed wrong.',
              fix: 'Ensure your URL is valid and starts with https://.'
            },
            {
              err: '"Filter already exists."',
              cause: 'You tried to add the same keyword twice for the same alias.',
              fix: 'Run `!filter list` to see your current rules.'
            }
          ].map(({ err, cause, fix }) => (
            <div key={err} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
               <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <code className="text-amber-400 font-bold text-xs uppercase">{err}</code>
              </div>
              <p className="text-neutral-400 text-xs mb-1"><strong>Reason:</strong> {cause}</p>
              <p className="text-emerald-400 text-xs font-bold"><strong>Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 my-12">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-400" /> 
            Pro Tip: Negative Filters
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed mb-4">
            Want to auto-delete spam? Use a "Negative Filter" by adding a minus sign in front of the word.
          </p>
          <CodeBlock code={`!filter add ghost -spam    (Any email with "spam" will be deleted instantly)`} />
        </div>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-neutral-800 flex justify-between items-center">
          <Link to="/docs/use-cases" className="px-6 py-3 rounded-2xl border border-neutral-800 text-neutral-400 font-bold hover:bg-neutral-900 transition-all flex items-center gap-2">
            Back: Use Cases
          </Link>
          <Link to="/docs/api" className="px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 group flex items-center gap-2">
            Next: API Reference <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
