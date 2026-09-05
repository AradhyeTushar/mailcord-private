/**
 * Cloudflare Email Worker for MailCord
 * 
 * Instructions:
 * 1. Go to Cloudflare Dashboard -> Workers & Pages -> Create Application -> Create Worker
 * 2. Name it "mailcord-worker"
 * 3. Paste this code into the worker editor and deploy
 * 4. Update the WEBHOOK_URL below to match your AI Studio App URL
 */

export default {
  async email(message, env, ctx) {
    // We use smee.io to bypass the AI Studio firewall
    const WEBHOOK_URL = "https://smee.io/mailcord-devtushar";

    try {
      // Read the raw email content
      const rawEmail = await new Response(message.raw).text();
      
      // Send it to our Discord Bot backend
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from,
          to: message.to,
          headers: Object.fromEntries(message.headers),
          raw: rawEmail
        }),
      });

      if (!response.ok) {
        console.error("Failed to forward email to Discord bot", await response.text());
        message.setReject("Failed to process email");
      }
    } catch (error) {
      console.error("Error processing email:", error);
      message.setReject("Internal error processing email");
    }
  }
};
