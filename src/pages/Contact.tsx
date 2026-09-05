import Layout from '../components/Layout';
import { Mail, MessageSquare, Twitter, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Get in Touch</h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            Have a question, feedback, or need support? We're here to help. Choose the best way to reach us below.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 text-center hover:bg-neutral-900 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Discord Support</h3>
            <p className="text-neutral-400 mb-6 text-sm">Join our official Discord server for the fastest support, community discussions, and direct access to the developers.</p>
            <a href="#" className="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium transition-colors">
              Join Server
            </a>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 text-center hover:bg-neutral-900 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Email Us</h3>
            <p className="text-neutral-400 mb-6 text-sm">For business inquiries, partnership opportunities, or private support matters, send us an email directly.</p>
            <a href="mailto:support@mailcord.app" className="inline-block px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full font-medium transition-colors">
              support@mailcord.app
            </a>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 text-center hover:bg-neutral-900 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Twitter className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Twitter / X</h3>
            <p className="text-neutral-400 mb-6 text-sm">Follow us on Twitter for quick updates, server status announcements, and feature teasers.</p>
            <a href="#" className="inline-block px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full font-medium transition-colors">
              @MailCordApp
            </a>
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-neutral-900/30 border border-neutral-800 rounded-3xl p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Send a Message</h2>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Your Name</label>
                <input type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Email Address</label>
                <input type="email" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="john@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Subject</label>
              <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none">
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Billing Question</option>
                <option>Feature Request</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Message</label>
              <textarea rows={5} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none" placeholder="How can we help you?"></textarea>
            </div>
            <button type="submit" className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
