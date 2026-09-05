import Layout from '../components/Layout';
import { Check, X } from 'lucide-react';

export default function Pricing() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Simple, Transparent Pricing</h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            Start for free, upgrade when you need more power. Secure payments powered by Razorpay.
          </p>
        </div>

        <h2 className="text-3xl font-bold mb-10 text-center">User Plans</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
          {/* Free User */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 flex flex-col">
            <h3 className="text-2xl font-semibold mb-2">Free</h3>
            <p className="text-neutral-400 mb-6">Basic email privacy.</p>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-bold">₹0</span>
              <span className="text-neutral-400">/forever</span>
            </div>
            <button onClick={() => window.location.href = '/dashboard?tab=billing'} className="w-full py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors mb-8">Current Plan</button>
            <div className="space-y-4 flex-1 text-sm">
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /><span className="text-neutral-300">10 Aliases</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /><span className="text-neutral-300">7-Day Alias Expiry</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /><span className="text-neutral-300">200 Inbox Size</span></div>
              <div className="flex items-center gap-3 opacity-50"><X className="w-4 h-4 text-neutral-500" /><span className="text-neutral-400">Custom Names</span></div>
              <div className="flex items-center gap-3 opacity-50"><X className="w-4 h-4 text-neutral-500" /><span className="text-neutral-400">Filters & Search</span></div>
            </div>
          </div>
          
          {/* Premium User */}
          <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-3xl p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
            <h3 className="text-2xl font-semibold mb-2 text-indigo-400">Premium</h3>
            <p className="text-indigo-200/70 mb-6">For power users.</p>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-bold">₹199</span>
              <span className="text-indigo-200/70">/month</span>
            </div>
            <button onClick={() => window.location.href = '/dashboard?tab=billing'} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors mb-8">Upgrade to Premium</button>
            <div className="space-y-4 flex-1 text-sm">
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-indigo-400" /><span className="text-neutral-200">100 Aliases</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-indigo-400" /><span className="text-neutral-200">No Expiry</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-indigo-400" /><span className="text-neutral-200">5,000 Inbox Size</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-indigo-400" /><span className="text-neutral-200">Custom Names</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-indigo-400" /><span className="text-neutral-200">Filters & Search</span></div>
            </div>
          </div>

          {/* Supreme User */}
          <div className="bg-purple-600/10 border border-purple-500/30 rounded-3xl p-8 flex flex-col">
            <h3 className="text-2xl font-semibold mb-2 text-purple-400">Supreme</h3>
            <p className="text-purple-200/70 mb-6">Ultimate freedom.</p>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-bold">₹499</span>
              <span className="text-purple-200/70">/month</span>
            </div>
            <button onClick={() => window.location.href = '/dashboard?tab=billing'} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors mb-8">Upgrade to Supreme</button>
            <div className="space-y-4 flex-1 text-sm">
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-purple-400" /><span className="text-neutral-200">Unlimited Aliases</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-purple-400" /><span className="text-neutral-200">No Expiry</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-purple-400" /><span className="text-neutral-200">Unlimited Inbox Size</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-purple-400" /><span className="text-neutral-200">Custom Names</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-purple-400" /><span className="text-neutral-200">API Access</span></div>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-10 text-center mt-20">Server Plans</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-24">
          {/* Pro Server */}
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-3xl p-8 flex flex-col">
            <h3 className="text-2xl font-semibold mb-2 text-blue-400">Pro Server</h3>
            <p className="text-blue-200/70 mb-6">Boost limits for all members in your server.</p>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-bold">₹999</span>
              <span className="text-blue-200/70">/month</span>
            </div>
            <button onClick={() => window.location.href = '/dashboard?tab=billing'} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors mb-8">Upgrade Server</button>
            <div className="space-y-4 flex-1 text-sm">
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-blue-400" /><span className="text-neutral-200">25 Aliases per member</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-blue-400" /><span className="text-neutral-200">30-Day Alias Expiry</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-blue-400" /><span className="text-neutral-200">500 Inbox Size per member</span></div>
            </div>
          </div>

          {/* Enterprise Server */}
          <div className="bg-amber-600/10 border border-amber-500/30 rounded-3xl p-8 flex flex-col">
            <h3 className="text-2xl font-semibold mb-2 text-amber-400">Enterprise Server</h3>
            <p className="text-amber-200/70 mb-6">Maximum power for large communities.</p>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-4xl font-bold">₹2499</span>
              <span className="text-amber-200/70">/month</span>
            </div>
            <button onClick={() => window.location.href = '/dashboard?tab=billing'} className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors mb-8">Upgrade Server</button>
            <div className="space-y-4 flex-1 text-sm">
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-400" /><span className="text-neutral-200">50 Aliases per member</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-400" /><span className="text-neutral-200">No Expiry</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-400" /><span className="text-neutral-200">1,000 Inbox Size per member</span></div>
              <div className="flex items-center gap-3"><Check className="w-4 h-4 text-amber-400" /><span className="text-neutral-200">Custom Names & Features</span></div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
