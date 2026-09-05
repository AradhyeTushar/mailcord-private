import Layout from '../components/Layout';
import { Shield, Lock, Server, EyeOff } from 'lucide-react';

export default function Security() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Security at MailCord</h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            We treat your emails with the highest level of security and privacy. Learn how we protect your data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8">
            <EyeOff className="w-8 h-8 text-indigo-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Zero-Retention Policy</h3>
            <p className="text-neutral-400 leading-relaxed">
              MailCord acts as a pure transit layer. When an email arrives, it is processed in memory, formatted for Discord, sent via the Discord API, and immediately discarded. We do not have a database of your email bodies.
            </p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8">
            <Lock className="w-8 h-8 text-emerald-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">End-to-End Encryption</h3>
            <p className="text-neutral-400 leading-relaxed">
              All data in transit is encrypted using industry-standard TLS 1.3. This includes the connection between the sender and Cloudflare, Cloudflare and our servers, and our servers and the Discord API.
            </p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8">
            <Server className="w-8 h-8 text-blue-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Cloudflare Infrastructure</h3>
            <p className="text-neutral-400 leading-relaxed">
              We leverage Cloudflare Email Routing for the initial receipt of emails. This provides enterprise-grade DDoS protection, spam filtering, and strict SPF/DKIM/DMARC enforcement before the email even reaches our servers.
            </p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8">
            <Shield className="w-8 h-8 text-amber-400 mb-6" />
            <h3 className="text-xl font-bold mb-3">Discord Native Security</h3>
            <p className="text-neutral-400 leading-relaxed">
              Because emails are delivered to private Discord channels, they inherit Discord's robust permission system. Only users you explicitly grant access to the category can read the emails.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-neutral-900/30 border border-neutral-800 rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-6">Vulnerability Reporting</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            We take security seriously. If you believe you have found a security vulnerability in MailCord, please report it to us immediately. We ask that you do not publicly disclose the issue until we have had a chance to address it.
          </p>
          <p className="text-neutral-400 mb-8 leading-relaxed">
            Please email your findings to <a href="mailto:security@mailcord.app" className="text-indigo-400 hover:underline">security@mailcord.app</a>. We will respond as quickly as possible.
          </p>
        </div>
      </div>
    </Layout>
  );
}
