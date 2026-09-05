import React from 'react';
import { PageHeader, SectionHeading, Callout, SpecTable, HighlightCard, Badge } from '../../components/docs/Shared';
import { CreditCard, ShieldCheck, Globe, RefreshCcw, FileText, Zap } from 'lucide-react';

export default function BillingDocs() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <PageHeader 
        title="Billing & Infrastructure" 
        description="Understanding plan tiers, secure payment protocols, and INR pricing models."
        lastUpdated="October 2023"
      />

      <div className="prose prose-invert max-w-none font-sans">
        <p className="text-lg text-neutral-300 leading-relaxed mb-12">
          MailCord provides a high-reliability communication infrastructure that scales with your community. Our billing system is designed for transparency, security, and global compatibility, primarily focused on the Indian market through Razorpay.
        </p>

        <SectionHeading id="payment-provider">Secured by Razorpay</SectionHeading>
        <p className="mb-8 leading-relaxed">
          To ensure the highest level of financial security, MailCord does not directly handle or store sensitive payment data. All transactions are processed via <strong>Razorpay</strong>, India's leading PCI-DSS compliant payment gateway.
        </p>

        <div className="grid md:grid-cols-3 gap-6 my-10">
          <HighlightCard 
            title="Encrypted Vault" 
            description="Your card and bank details are handled on Razorpay's encrypted servers. MailCord only receives an anonymized transaction token."
            icon={ShieldCheck}
            variant="indigo"
          />
          <HighlightCard 
            title="UPI Native" 
            description="Optimized for India. Pay seamlessly via Google Pay, PhonePe, and Paytm directly from the web overlay."
            icon={Zap}
            variant="neutral"
          />
          <HighlightCard 
            title="Zero Storage" 
            description="We never store CVVs or card numbers. Our platform acts as a secure redirection layer for your financial safety."
            icon={RefreshCcw}
            variant="neutral"
          />
        </div>

        <SectionHeading id="pricing-tiers">Subsciption Tiers (INR)</SectionHeading>
        <p className="mb-6">We offer both User-level and Server-level upgrades to provide maximum flexibility for different community roles.</p>

        <div className="space-y-8 my-10">
          <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
                <Badge variant="indigo">Personal Upgrade</Badge>
            </div>
            <h4 className="text-2xl font-bold text-white mb-4">Individual User Plans</h4>
            <p className="text-sm text-neutral-400 mb-6">Upgrade your personal identity across any Discord server that has MailCord installed.</p>
            <SpecTable 
              headers={['Plan Name', 'Price (Monthly)', 'Alias Limit', 'Inbox Capacity']}
              rows={[
                ['Free Core', '₹0', '5 Aliases', '100 Messages'],
                ['Premium', '₹199', '100 Aliases', '5,000 Messages'],
                ['Supreme', '₹499', 'Unlimited', 'Unlimited History'],
              ]}
            />
          </div>

          <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
                <Badge variant="emerald">Community Upgrade</Badge>
            </div>
            <h4 className="text-2xl font-bold text-white mb-4">Professional Server Boost</h4>
            <p className="text-sm text-neutral-400 mb-6">Boost limits for every single member in your Discord server at once.</p>
            <SpecTable 
              headers={['Plan Name', 'Price (Monthly)', 'Global Aliases', 'Retention Period']}
              rows={[
                ['Standard Guild', '₹0', 'Disabled', '7 Days'],
                ['Pro Server', '₹999', 'Increased Base', '30 Days'],
                ['Enterprise', '₹2,499', 'Unlimited Base', 'Lifetime Storage'],
              ]}
            />
          </div>
        </div>

        <SectionHeading id="management">Managing Your Infrastructure</SectionHeading>
        <p className="mb-6">Billing management is self-service and can be accessed via the **Command Center** tab in your dashboard.</p>
        
        <div className="flex gap-4 my-8">
            <div className="flex-1 p-6 rounded-2xl border border-neutral-800 bg-[#0d0d0d]">
                <FileText className="w-6 h-6 text-indigo-400 mb-3" />
                <h5 className="text-white font-bold mb-1">Invoicing</h5>
                <p className="text-xs text-neutral-500">Official tax invoices are generated per transaction and sent to your Discord-linked email.</p>
            </div>
            <div className="flex-1 p-6 rounded-2xl border border-neutral-800 bg-[#0d0d0d]">
                <Globe className="w-6 h-6 text-emerald-400 mb-3" />
                <h5 className="text-white font-bold mb-1">Region Locking</h5>
                <p className="text-xs text-neutral-500">Currently optimized for Indian residents. International payments are handled via Global Card networks.</p>
            </div>
        </div>

        <SectionHeading id="cancellation">Cancellation & Refund Policy</SectionHeading>
        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-200/80">
            <p className="mb-4 text-sm font-medium">Subscriptions can be cancelled at any time through the dashboard. The following protocols apply:</p>
            <ul className="list-disc list-inside space-y-2 text-xs opacity-70">
                <li>Cancellation takes effect <strong>immediately</strong>; your limits revert to the Free Tier instantly.</li>
                <li>Prorated refunds are not supported for remaining monthly time.</li>
                <li>In case of accidental duplicate charges, contact our support desk within 24 hours.</li>
            </ul>
        </div>

        <Callout type="info" title="Bulk Licensing">
          Running a network of 10+ Discord servers? Contact our <a href="#" className="text-indigo-400 hover:underline">Enterprise Relations team</a> for custom volume pricing and dedicated hardware allocation.
        </Callout>

        <div className="mt-16 text-center border-t border-neutral-900 pt-12">
            <h4 className="text-white font-bold mb-2">Ready to Upgrade?</h4>
            <p className="text-sm text-neutral-500 mb-8">Take your community to the next level with enterprise-grade anonymity.</p>
            <a href="/dashboard?tab=billing" className="inline-flex items-center gap-3 px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all">
                Visit Billing Dashboard
            </a>
        </div>
      </div>
    </div>
  );
}
