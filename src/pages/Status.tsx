import Layout from '../components/Layout';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function Status() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">System Status</h1>
            <p className="text-neutral-400">Current status of MailCord services and infrastructure.</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-emerald-400 font-medium">All Systems Operational</span>
          </div>
        </div>

        <div className="space-y-6 mb-16">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Discord Bot</h3>
                <p className="text-sm text-neutral-400">Command processing and message delivery</p>
              </div>
            </div>
            <span className="text-emerald-400 font-medium">Operational</span>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Email Routing (Cloudflare)</h3>
                <p className="text-sm text-neutral-400">Incoming email processing and forwarding</p>
              </div>
            </div>
            <span className="text-emerald-400 font-medium">Operational</span>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Web Dashboard</h3>
                <p className="text-sm text-neutral-400">User interface and OAuth login</p>
              </div>
            </div>
            <span className="text-emerald-400 font-medium">Operational</span>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">REST API</h3>
                <p className="text-sm text-neutral-400">Developer API endpoints</p>
              </div>
            </div>
            <span className="text-emerald-400 font-medium">Operational</span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Past Incidents</h2>
          <div className="border-l-2 border-neutral-800 ml-4 pl-6 py-2 space-y-8">
            <div className="relative">
              <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-neutral-800 border-4 border-neutral-950"></div>
              <h4 className="text-lg font-semibold text-neutral-200 mb-1">No incidents reported today.</h4>
              <p className="text-sm text-neutral-500">April 6, 2026</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-neutral-800 border-4 border-neutral-950"></div>
              <h4 className="text-lg font-semibold text-neutral-200 mb-1">Delayed Email Delivery</h4>
              <p className="text-sm text-neutral-500 mb-3">March 22, 2026</p>
              <div className="bg-neutral-900/30 rounded-xl p-4 border border-neutral-800">
                <p className="text-neutral-400 text-sm mb-2"><strong className="text-neutral-300">Resolved</strong> - The backlog of emails has been fully processed and delivery times are back to normal.</p>
                <p className="text-neutral-400 text-sm"><strong className="text-neutral-300">Investigating</strong> - We are experiencing a delay in processing incoming emails due to an upstream issue with Cloudflare Workers. Emails are queued and will not be lost.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
