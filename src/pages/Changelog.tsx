import Layout from '../components/Layout';
import { Calendar, Tag } from 'lucide-react';

export default function Changelog() {
  const updates = [
    {
      version: "v2.1.0",
      date: "April 6, 2026",
      type: "Feature",
      title: "Web Dashboard & Real-time Sync",
      description: "We've completely overhauled the web experience. You can now log in with Discord to view your aliases, inbox history, and statistics in real-time.",
      changes: [
        "Added Discord OAuth2 login flow",
        "Created new Dashboard interface with real-time stats",
        "Added Inbox History tab to view recent emails on the web",
        "Improved bot message UI with rich embeds for all commands"
      ]
    },
    {
      version: "v2.0.0",
      date: "March 15, 2026",
      type: "Major",
      title: "Cloudflare Email Routing Integration",
      description: "Switched our backend infrastructure to utilize Cloudflare Email Routing for significantly faster and more reliable email delivery.",
      changes: [
        "Migrated to Cloudflare API for alias management",
        "Improved delivery speeds by 400%",
        "Added support for custom domain routing (Pro feature)",
        "Enhanced spam filtering and DMARC compliance"
      ]
    },
    {
      version: "v1.5.2",
      date: "February 28, 2026",
      type: "Fix",
      title: "Attachment Handling Improvements",
      description: "Fixed several bugs related to how the bot handles email attachments and large messages.",
      changes: [
        "Fixed an issue where large PDFs would fail to upload to Discord",
        "Added support for inline images in HTML emails",
        "Truncated extremely long text emails to fit Discord's 2000 character limit with a 'Read More' link",
        "Optimized memory usage during attachment processing"
      ]
    },
    {
      version: "v1.0.0",
      date: "January 10, 2026",
      type: "Release",
      title: "Initial Public Release",
      description: "MailCord is now available to the public! Bring your inbox directly into your Discord server.",
      changes: [
        "Basic alias creation and deletion commands",
        "Private category generation for users",
        "Incoming email forwarding to Discord channels",
        "Basic reply functionality"
      ]
    }
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Changelog</h1>
          <p className="text-xl text-neutral-400">
            Keep track of the latest updates, improvements, and bug fixes to MailCord.
          </p>
        </div>

        <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-800 before:to-transparent">
          {updates.map((update, index) => (
            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-neutral-800 bg-neutral-950 text-neutral-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-indigo-400 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {update.version}
                  </span>
                  <time className="text-sm text-neutral-500">{update.date}</time>
                </div>
                <h3 className="text-xl font-bold mb-2">{update.title}</h3>
                <p className="text-neutral-400 mb-4 text-sm leading-relaxed">{update.description}</p>
                <ul className="space-y-2">
                  {update.changes.map((change, i) => (
                    <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                      <span className="text-neutral-600 mt-1">-</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
