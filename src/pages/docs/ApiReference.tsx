import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, SectionHeading, HighlightCard, Callout, CodeBlock, SpecTable, Badge } from '../../components/docs/Shared';
import { Code, Lock, Globe, Terminal, AlertTriangle, ArrowRight, Info } from 'lucide-react';

export default function ApiReference() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <PageHeader
        title="API Reference"
        description="Programmatically manage aliases and messages with our REST API."
        lastUpdated="April 2024"
      />

      <div className="prose prose-invert max-w-none">
        
        {/* 1. Simple Explanation */}
        <SectionHeading id="simple">What is the API?</SectionHeading>
        <p className="text-lg text-neutral-300 mb-6 leading-relaxed">
          The **API** (Application Programming Interface) allows your own apps, websites, or bots to talk to NebulaMailCord. Instead of typing commands in Discord, your code sends a request to our servers to create aliases or fetch messages.
        </p>

        {/* 2. 🧩 How it works (Standard format) */}
        <SectionHeading id="how-it-works">🧩 How API Auth Works</SectionHeading>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 mb-12">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center">
                 <p className="text-indigo-400 font-bold text-xs mb-2">1. Get Key</p>
                 <p className="text-neutral-500 text-[10px]">From Web Dashboard</p>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-neutral-800 shrink-0" />
              <div className="text-center">
                 <p className="text-indigo-400 font-bold text-xs mb-2">2. Send Header</p>
                 <code className="text-[10px] text-neutral-300">Authorization: Bearer ...</code>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-neutral-800 shrink-0" />
              <div className="text-center">
                 <p className="text-indigo-400 font-bold text-xs mb-2">3. Access Granted</p>
                 <p className="text-emerald-400 text-[10px] font-bold">200 OK</p>
              </div>
           </div>
        </div>

        {/* Auth Section */}
        <SectionHeading id="auth">Authentication</SectionHeading>
        <p className="text-neutral-400 text-sm mb-4">Every request must include your secret integration key.</p>
        <CodeBlock code={`Authorization: Bearer mc_live_xxxxxxxxxxxx`} />

        {/* Endpoints */}
        <SectionHeading id="endpoints">Quick Endpoints</SectionHeading>
        <div className="my-8 space-y-4">
           <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="flex items-center gap-3 mb-4">
                 <Badge variant="emerald">POST</Badge>
                 <code className="text-white font-bold text-sm">/alias/create</code>
              </div>
              <CodeBlock language="json" code={`{ "name": "ghost", "ownerId": "12345" }`} />
           </div>

           <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="flex items-center gap-3 mb-4">
                 <Badge variant="indigo">GET</Badge>
                 <code className="text-white font-bold text-sm">/inbox/messages?alias=ghost</code>
              </div>
              <p className="text-neutral-500 text-[10px] uppercase font-bold">Returns 20 most recent messages</p>
           </div>
        </div>

        {/* 🚨 ERROR HANDLING (CRITICAL) */}
        <SectionHeading id="errors">🚨 ERROR HANDLING (CRITICAL)</SectionHeading>
        
        <div className="space-y-4 my-8">
          {[
            {
              code: '401 Unauthorized',
              err: '"Invalid Integration Secret"',
              cause: 'Your Bearer token is missing, expired, or typed incorrectly.',
              fix: 'Generate a new secret in your Web Dashboard and ensure you include "Bearer " (with a space) in the header.'
            },
            {
              code: '429 Too Many Requests',
              err: '"Rate limit exceeded (60 RPM)"',
              cause: 'You sent more than 60 requests in one minute.',
              fix: 'Slow down your code. Supreme users can request a limit increase.'
            },
            {
              code: '403 Forbidden',
              err: '"Insufficient Plan Permissions"',
              cause: 'You tried to use a feature (like webhooks) that isn\'t on your current plan.',
              fix: 'Upgrade your account in the Discord `/user settings`.'
            },
            {
              code: '400 Bad Request',
              err: '"Missing targetId"',
              cause: 'Your JSON body is missing a required field.',
              fix: 'Check the "Required" column in the endpoint documentation tables.'
            }
          ].map(({ code, err, cause, fix }) => (
            <div key={code} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
               <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                   <AlertTriangle className="w-4 h-4 text-red-500" />
                   <code className="text-red-400 font-bold text-xs uppercase">{err}</code>
                </div>
                <Badge variant="neutral">{code}</Badge>
              </div>
              <p className="text-neutral-400 text-xs mb-1"><strong>Reason:</strong> {cause}</p>
              <p className="text-emerald-400 text-xs font-bold"><strong>Fix:</strong> {fix}</p>
            </div>
          ))}
        </div>

        {/* Tip */}
        <Callout type="warning" title="Security Requirement">
          Always use HTTPS. The API will reject any request made over unencrypted HTTP.
        </Callout>

        {/* Navigation */}
        <div className="mt-16 pt-8 border-t border-neutral-800 flex justify-between items-center">
          <Link to="/docs/bot-workflows" className="px-6 py-3 rounded-2xl border border-neutral-800 text-neutral-400 font-bold hover:bg-neutral-900 transition-all flex items-center gap-2">
            Back: Bot Workflows
          </Link>
          <Link to="/docs/webhooks" className="px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-500/20 group flex items-center gap-2">
            Next: Webhooks <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
