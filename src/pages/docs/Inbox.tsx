import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, Callout, CodeBlock, SpecTable, DiscordMockup } from '../../components/docs/Shared';
import { Inbox, Search, RotateCcw, AlertTriangle, ArrowRight, Info, BookOpen } from 'lucide-react';

export default function InboxSystem() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <PageHeader
        title="Inbox System"
        description="Your private hub for all incoming anonymous mail."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        {/* 1. Simple Explanation */}
        <SectionHeading id="simple">What is the Inbox?</SectionHeading>
        <p className="text-lg text-neutral-300 mb-6 leading-relaxed">
          The **Inbox** is your personal command center inside Discord. It's a private set of channels that only <strong>you</strong> and the bot can see. All messages sent to your aliases land here automatically.
        </p>

        {/* 2. 🧩 How it works (Standard format) */}
        <SectionHeading id="how-it-works">🧩 How It Works</SectionHeading>
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 mb-8">
           <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                 <p className="text-neutral-300 text-sm">Someone sends an email to your alias <code>ghost@mailcord.uk</code></p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                 <p className="text-neutral-300 text-sm">NebulaMailCord routes it to your private <code>#inbox</code> channel.</p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                 <p className="text-neutral-400 text-sm italic">"Reply works anonymously using the MailCard ID provided with the email."</p>
              </div>
           </div>
        </div>

        {/* Channels */}
        <SectionHeading id="channels">Your Private Channels</SectionHeading>
        <div className="grid md:grid-cols-2 gap-4 my-8">
           <HighlightCard title="#announcements" description="System pings, renewal alerts, and new message notifications." icon={Info} variant="indigo" />
           <HighlightCard title="#inbox" description="The actual text of all your incoming anonymous messages." icon={Inbox} variant="neutral" />
        </div>

        {/* Commands */}
        <SectionHeading id="commands">Inbox Commands</SectionHeading>
        <CodeBlock code={`!inbox history <alias_name>    (Shortcut: !ih <name>)\n!inbox search <keyword>       (Shortcut: !is <keyword>)\n!inbox reset                  (Clears history)`} />
        
        <DiscordMockup messages={[
          {
            user: 'Alex',
            content: <code className="text-xs text-indigo-300">!inbox history ghost</code>,
            time: '4:00 PM'
          },
          {
            user: 'NebulaMailCord',
            isBot: true,
            avatar: 'N',
            content: (
              <div className="space-y-3">
                <p className="text-white font-bold text-sm">📬 Recent Messages for ghost</p>
                <div className="border border-neutral-700/50 rounded-lg p-3 space-y-1">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest text-[#5865f2]">Message #1</p>
                  <p className="text-xs text-neutral-200">"Hey ghost, I wanted to follow up on our trade."</p>
                  <p className="text-[10px] text-neutral-500">From: anonymous | ID: MC-9121</p>
                </div>
              </div>
            ),
            time: '4:00 PM'
          }
        ]} />

        {/* 🚨 ERROR HANDLING (CRITICAL) */}
        <SectionHeading id="errors">🚨 ERROR HANDLING (CRITICAL)</SectionHeading>
        
        <div className="space-y-4 my-8">
          {[
            {
              err: '"No inbox found for this server."',
              cause: 'You haven\'t clicked "Create My Inbox" in the #setup channel yet.',
              fix: 'Go to the #setup channel and click the button to create your channels.'
            },
            {
              err: '"No emails found for this alias."',
              cause: 'The alias exists, but no one has sent any messages to it yet.',
              fix: 'Share your alias with people! Once they message you, the history will appear.'
            },
            {
              err: '"MailCord Pro Required: Search is premium."',
              cause: 'You tried to use `!is` or `!inbox search` on a Free plan.',
              fix: 'Searching across all aliases is a Premium feature. Upgrade in `/user settings`.'
            },
            {
              err: '"Alias not found or not owned by you."',
              cause: 'You typed the alias name wrong in the history command.',
              fix: 'Usage: `!inbox history ghost`. Replace "ghost" with your actual alias.'
            }
          ].map(({ err, cause, fix }) => (
            <div key={err} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
               <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <code className="text-red-400 font-bold text-xs uppercase">{err}</code>
              </div>
              <p className="text-neutral-400 text-xs mb-1"><strong>Reason:</strong> {cause}</p>
              <p className="text-emerald-400 text-xs font-bold"><strong>Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-neutral-800 flex justify-between items-center">
          <Link to="/docs/messaging-flow" className="px-6 py-3 rounded-2xl border border-neutral-800 text-neutral-400 font-bold hover:bg-neutral-900 transition-all flex items-center gap-2">
            Back: Messaging
          </Link>
          <Link to="/docs/user-guide" className="px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 group flex items-center gap-2">
            Next: User Guide <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
