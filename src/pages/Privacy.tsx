import Layout from '../components/Layout';

export default function Privacy() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-neutral-400">Last updated: April 6, 2026</p>
        </div>

        <div className="prose prose-invert prose-indigo max-w-none">
          <p className="text-lg text-neutral-300 mb-8">
            At MailCord, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our Discord bot.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">1. Information We Collect</h2>
          <p className="text-neutral-400 mb-4 leading-relaxed">We collect information that you provide directly to us when you use the Service:</p>
          <ul className="list-disc pl-6 text-neutral-400 mb-6 space-y-2">
            <li><strong>Discord Profile Information:</strong> When you log in via Discord, we receive your Discord ID, username, discriminator, and avatar URL.</li>
            <li><strong>Email Metadata:</strong> We process the sender, recipient, subject, and timestamp of emails to route them to the correct Discord channel.</li>
            <li><strong>Bot Usage Data:</strong> We log commands executed, aliases created, and general interaction metrics to improve the service.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">2. How We Handle Email Content</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            <strong>We do not store the body content of your emails.</strong> When an email is received via Cloudflare, our server processes it, formats it into a Discord message, sends it to the Discord API, and immediately discards the content from our memory. The only place the email content persists is within your private Discord channel.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">3. How We Use Your Information</h2>
          <p className="text-neutral-400 mb-4 leading-relaxed">We use the information we collect to:</p>
          <ul className="list-disc pl-6 text-neutral-400 mb-6 space-y-2">
            <li>Provide, maintain, and improve our Service.</li>
            <li>Process and route incoming emails to the correct Discord channels.</li>
            <li>Authenticate your identity via Discord OAuth2.</li>
            <li>Respond to your comments, questions, and customer service requests.</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our Service.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">4. Sharing of Information</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you (such as Cloudflare for email routing and Discord for message delivery), so long as those parties agree to keep this information confidential.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">5. Data Security</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            We implement a variety of security measures to maintain the safety of your personal information. All data transferred between our servers, Cloudflare, and Discord is encrypted using TLS/SSL. However, no method of transmission over the Internet, or method of electronic storage, is 100% secure.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">6. Your Data Rights</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            You have the right to request access to the data we hold about you, to request that we correct any inaccuracies, and to request that we delete your data. You can delete all your aliases and associated data at any time using the bot commands or the web dashboard.
          </p>
        </div>
      </div>
    </Layout>
  );
}
