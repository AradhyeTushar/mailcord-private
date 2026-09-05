import Layout from '../components/Layout';
import { Code, Terminal } from 'lucide-react';

export default function Api() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6 border border-indigo-500/20">
            <Code className="w-4 h-4" />
            <span>Pro Feature</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">API Reference</h1>
          <p className="text-xl text-neutral-400 max-w-3xl">
            Integrate MailCord directly into your own applications. The REST API allows you to programmatically manage aliases and read emails.
          </p>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4">Authentication</h2>
          <p className="text-neutral-400 mb-6">
            All API requests require a Bearer token. You can generate an API key from the Web Dashboard under the "Developer" tab.
          </p>
          <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 font-mono text-sm text-neutral-300 overflow-x-auto">
            Authorization: Bearer mc_live_xxxxxxxxxxxxxxxxx
          </div>
        </div>

        <div className="space-y-12">
          {/* Endpoint 1 */}
          <div className="border border-neutral-800 rounded-3xl overflow-hidden">
            <div className="bg-neutral-900/80 px-6 py-4 border-b border-neutral-800 flex items-center gap-4">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-mono text-sm font-bold rounded">GET</span>
              <code className="font-mono text-neutral-200">/v1/aliases</code>
            </div>
            <div className="p-6 bg-neutral-950">
              <p className="text-neutral-400 mb-6">Returns a list of all active aliases for the authenticated user.</p>
              <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">Response</h4>
              <pre className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 overflow-x-auto text-sm text-indigo-300 font-mono">
{`{
  "data": [
    {
      "id": "al_12345",
      "address": "netflix@yourdomain.com",
      "channel_id": "1234567890",
      "created_at": "2026-04-06T12:00:00Z"
    }
  ]
}`}
              </pre>
            </div>
          </div>

          {/* Endpoint 2 */}
          <div className="border border-neutral-800 rounded-3xl overflow-hidden">
            <div className="bg-neutral-900/80 px-6 py-4 border-b border-neutral-800 flex items-center gap-4">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 font-mono text-sm font-bold rounded">POST</span>
              <code className="font-mono text-neutral-200">/v1/aliases</code>
            </div>
            <div className="p-6 bg-neutral-950">
              <p className="text-neutral-400 mb-6">Creates a new email alias.</p>
              <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">Request Body</h4>
              <pre className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 overflow-x-auto text-sm text-indigo-300 font-mono mb-6">
{`{
  "name": "shopping"
}`}
              </pre>
              <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">Response</h4>
              <pre className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 overflow-x-auto text-sm text-indigo-300 font-mono">
{`{
  "id": "al_67890",
  "address": "shopping@yourdomain.com",
  "channel_id": "0987654321",
  "created_at": "2026-04-06T12:05:00Z"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
