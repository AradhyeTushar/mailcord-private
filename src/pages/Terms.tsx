import Layout from '../components/Layout';

export default function Terms() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-neutral-400">Last updated: April 6, 2026</p>
        </div>

        <div className="prose prose-invert prose-indigo max-w-none">
          <p className="text-lg text-neutral-300 mb-8">
            Please read these Terms and Conditions carefully before using the MailCord service operated by MailCord Inc.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">1. Acceptance of Terms</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            By accessing or using MailCord, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service. These Terms apply to all visitors, users, and others who access or use the Service.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">2. Description of Service</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            MailCord provides a Discord bot and web dashboard that allows users to create email aliases, receive emails within Discord channels, and reply to those emails. The service utilizes third-party APIs including Discord and Cloudflare.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">3. User Accounts and Discord Integration</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            To use MailCord, you must have a valid Discord account. You are responsible for safeguarding the password that you use to access Discord and for any activities or actions under your password. We cannot and will not be liable for any loss or damage arising from your failure to comply with this security obligation.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">4. Acceptable Use Policy</h2>
          <p className="text-neutral-400 mb-4 leading-relaxed">You agree not to use the Service to:</p>
          <ul className="list-disc pl-6 text-neutral-400 mb-6 space-y-2">
            <li>Send spam, unsolicited messages, or bulk emails.</li>
            <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
            <li>Transmit any material that contains software viruses or any other computer code designed to interrupt, destroy, or limit the functionality of any computer software.</li>
            <li>Engage in any activity that violates any applicable local, state, national, or international law.</li>
            <li>Use the service for phishing, fraud, or distributing malware.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">5. Termination</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">6. Limitation of Liability</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            In no event shall MailCord, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">7. Changes to Terms</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>
        </div>
      </div>
    </Layout>
  );
}
