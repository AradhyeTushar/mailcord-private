import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, Callout, CodeBlock, SpecTable, Badge } from '../../components/docs/Shared';
import { Webhook, Zap, Globe, Shield, AlertTriangle, ArrowRight, Info } from 'lucide-react';

export default function WebhooksDocs() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <PageHeader
        title="Webhooks"
        description="Forward messages from NebulaMailCord to your own applications."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        {/* 1. Simple Explanation */}
        <SectionHeading id="simple">What are Webhooks?</SectionHeading>
        <p className="text-lg text-neutral-300 mb-6 leading-relaxed">
          A **Webhook** is like a "Push Notification" for your server. Instead of you asking NebulaMailCord "do I have new messages?", the bot pushes the message to your URL the instant it arrives.
        </p>

        {/* 2. 🧩 How it works (Standard format) */}
        <SectionHeading id="how-it-works">🧩 How Webhooks Flow</SectionHeading>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 mb-12">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center">
                 <p className="text-indigo-400 font-bold text-xs mb-2">1. Mail Recv</p>
                 <p className="text-neutral-500 text-[10px]">Email hits alias</p>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-neutral-800 shrink-0" />
              <div className="text-center">
                 <p className="text-indigo-400 font-bold text-xs mb-2">2. Bot Fires</p>
                 <p className="text-neutral-500 text-[10px]">Sends POST request</p>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-neutral-800 shrink-0" />
              <div className="text-center">
                 <p className="text-indigo-400 font-bold text-xs mb-2">3. Your URL</p>
                 <p className="text-emerald-400 text-[10px] font-bold">Processes payload</p>
              </div>
           </div>
        </div>

        {/* Setup */}
        <SectionHeading id="setup">Setup Command</SectionHeading>
        <CodeBlock code={`!alias webhook ghost https://your-app.com/api/webhooks`} />

        {/* Payload */}
        <SectionHeading id="payload">Example Payload (JSON)</SectionHeading>
        <CodeBlock language="json" code={`{
  "event": "mail.received",
  "alias": "ghost",
  "from": "anonymous@nebula.app",
  "subject": "Hello",
  "body": "This is a secret message.",
  "mailcardId": "MC-7721-XT"
}`} />

        {/* 🚨 ERROR HANDLING (CRITICAL) */}
        <SectionHeading id="errors">🚨 ERROR HANDLING (CRITICAL)</SectionHeading>
        
        <div className="space-y-4 my-8">
          {[
            {
              err: '"Invalid URL format for webhook."',
              cause: 'Your URL doesn\'t start with "https://" or contains invalid characters.',
              fix: 'Carefully check your URL in the `!alias webhook` command. It must be a valid public endpoint.'
            },
            {
              err: '"Premium Required: Webhooks are a premium feature."',
              cause: 'You tried to attach a webhook while on a Free plan.',
              fix: 'Upgrade to Premium or Supreme in `/user settings` to use real-time forwarding.'
            },
            {
              err: '"Endpoint returned 5xx / 4xx"',
              cause: 'NebulaMailCord sent the message, but your server crashed or blocked it.',
              fix: 'Check your server logs. NebulaMailCord will retry 3 times before giving up.'
            },
            {
              err: '"Signature verification failed"',
              cause: 'The security check (HMAC) between our server and yours failed.',
              fix: 'Ensure your `WEBHOOK_SECRET` matches the one shown in your dashboard.'
            }
          ].map(({ err, cause, fix }) => (
            <div key={err} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
               <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <code className="text-amber-400 font-bold text-xs uppercase">{err}</code>
              </div>
              <p className="text-neutral-400 text-xs mb-1"><strong>The Reason:</strong> {cause}</p>
              <p className="text-emerald-400 text-xs font-bold"><strong>The Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>

        {/* Tip */}
        <Callout type="info" title="3 Retries">
          If your server is down, NebulaMailCord doesn't just give up. We will retry sending the webhook <strong>3 times</strong> (at 5s, 60s, and 5min intervals). If it still fails, the event is dropped.
        </Callout>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-neutral-800 flex justify-between items-center">
          <Link to="/docs/api" className="px-6 py-3 rounded-2xl border border-neutral-800 text-neutral-400 font-bold hover:bg-neutral-900 transition-all flex items-center gap-2">
            Back: API Reference
          </Link>
          <Link to="/docs/config" className="px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 group flex items-center gap-2">
            Next: Configuration <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
