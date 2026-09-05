import Layout from '../components/Layout';
import { MessageSquare, Github, Twitter, Heart } from 'lucide-react';

export default function Community() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-8">
            <Heart className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Join the Community</h1>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            MailCord is built for communities, by a community. Connect with other users, share your setups, and help shape the future of the platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-3xl p-8 hover:bg-[#5865F2]/20 transition-colors group cursor-pointer">
            <MessageSquare className="w-10 h-10 text-[#5865F2] mb-6" />
            <h3 className="text-2xl font-bold mb-3 text-white">Discord Server</h3>
            <p className="text-neutral-400 mb-8 leading-relaxed">
              The heart of our community. Join thousands of other server admins to discuss use cases, get immediate support, and participate in beta testing new features.
            </p>
            <div className="flex items-center text-[#5865F2] font-medium group-hover:translate-x-2 transition-transform">
              Join the Conversation &rarr;
            </div>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 hover:bg-neutral-900 transition-colors group cursor-pointer">
            <Github className="w-10 h-10 text-white mb-6" />
            <h3 className="text-2xl font-bold mb-3 text-white">Open Source</h3>
            <p className="text-neutral-400 mb-8 leading-relaxed">
              Parts of our infrastructure and tooling are open source. Contribute code, report bugs, or request features directly on our GitHub repositories.
            </p>
            <div className="flex items-center text-white font-medium group-hover:translate-x-2 transition-transform">
              View on GitHub &rarr;
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/30 border border-neutral-800 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-6">Community Guidelines</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            We strive to maintain a welcoming, inclusive, and helpful environment for everyone. Whether you're a seasoned developer or a first-time server owner, you belong here.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
            <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-800">
              <h4 className="font-bold text-white mb-2">Be Respectful</h4>
              <p className="text-sm text-neutral-400">Treat everyone with kindness. Harassment or toxic behavior is not tolerated.</p>
            </div>
            <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-800">
              <h4 className="font-bold text-white mb-2">Be Helpful</h4>
              <p className="text-sm text-neutral-400">Share your knowledge. If you see someone struggling with a setup you've mastered, lend a hand.</p>
            </div>
            <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-800">
              <h4 className="font-bold text-white mb-2">Share Feedback</h4>
              <p className="text-sm text-neutral-400">Constructive criticism is how we grow. Let us know what works and what doesn't.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
