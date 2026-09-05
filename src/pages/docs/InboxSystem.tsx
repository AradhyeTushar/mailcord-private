import React from 'react';
import { PageHeader, SectionHeading, CodeBlock } from '../../components/docs/Shared';

export default function InboxSystem() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Inbox System" 
        description="Manage your conversations via the web dashboard."
        lastUpdated="October 24, 2023"
      />

      <SectionHeading id="web-dashboard">The Web Dashboard</SectionHeading>
      <p>
        While you can receive messages directly in Discord DMs, MailCord also provides a comprehensive web dashboard for managing your inbox.
      </p>
      
      <p className="mt-4">
        Access your inbox by logging in at <code>mailcord.app/dashboard</code>.
      </p>

      <SectionHeading id="features">Dashboard Features</SectionHeading>
      <ul className="list-disc list-inside space-y-2 mt-4 text-neutral-300">
        <li><strong>Threaded Conversations:</strong> View entire message histories with specific aliases.</li>
        <li><strong>Read Receipts:</strong> See when your messages have been read (if enabled).</li>
        <li><strong>Block List:</strong> Block specific aliases from sending you messages.</li>
        <li><strong>Export:</strong> Download conversation logs as JSON or TXT files.</li>
      </ul>

      <SectionHeading id="blocking-users">Blocking Aliases</SectionHeading>
      <p>If you are receiving spam or harassment from a specific alias, you can block them via the dashboard or using the following command:</p>
      <CodeBlock code="!alias block <target_alias>" />
    </div>
  );
}
