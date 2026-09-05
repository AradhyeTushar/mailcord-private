import Layout from '../components/Layout';
import { Mail, Users, Globe, Shield } from 'lucide-react';

export default function About() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-8">
            <Mail className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">About MailCord</h1>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            We're bridging the gap between traditional email and modern community platforms. 
            Because your inbox shouldn't be a silo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-24">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-neutral-400 text-lg leading-relaxed mb-6">
              Email is the universal protocol of the internet, but the tools we use to manage it haven't fundamentally changed in decades. Meanwhile, platforms like Discord have revolutionized how teams and communities communicate in real-time.
            </p>
            <p className="text-neutral-400 text-lg leading-relaxed">
              MailCord was built to bring these two worlds together. We believe that managing temporary emails, custom domains, and shared inboxes shouldn't require clunky webmail interfaces. It should happen right where you already work and play.
            </p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-neutral-950 rounded-2xl border border-neutral-800">
                <div className="text-4xl font-bold text-indigo-400 mb-2">1M+</div>
                <div className="text-sm text-neutral-500">Emails Processed</div>
              </div>
              <div className="text-center p-6 bg-neutral-950 rounded-2xl border border-neutral-800">
                <div className="text-4xl font-bold text-emerald-400 mb-2">50k+</div>
                <div className="text-sm text-neutral-500">Active Aliases</div>
              </div>
              <div className="text-center p-6 bg-neutral-950 rounded-2xl border border-neutral-800">
                <div className="text-4xl font-bold text-cyan-400 mb-2">10k+</div>
                <div className="text-sm text-neutral-500">Discord Servers</div>
              </div>
              <div className="text-center p-6 bg-neutral-950 rounded-2xl border border-neutral-800">
                <div className="text-4xl font-bold text-amber-400 mb-2">99.9%</div>
                <div className="text-sm text-neutral-500">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-24">
          <h2 className="text-3xl font-bold mb-12 text-center">Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-3xl p-8">
              <Shield className="w-8 h-8 text-emerald-400 mb-6" />
              <h3 className="text-xl font-semibold mb-3">Privacy First</h3>
              <p className="text-neutral-400">We don't read your emails. Our systems process and forward messages instantly without storing the body content permanently. Your data is yours.</p>
            </div>
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-3xl p-8">
              <Globe className="w-8 h-8 text-blue-400 mb-6" />
              <h3 className="text-xl font-semibold mb-3">Open Ecosystem</h3>
              <p className="text-neutral-400">By leveraging Cloudflare's robust infrastructure and Discord's API, we build on top of giants to provide a reliable, scalable service.</p>
            </div>
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-3xl p-8">
              <Users className="w-8 h-8 text-purple-400 mb-6" />
              <h3 className="text-xl font-semibold mb-3">Community Driven</h3>
              <p className="text-neutral-400">Every feature we build is inspired by our users. From custom domains to auto-replies, we listen to what server admins actually need.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
