export interface ParsedEmailBody {
  mainText: string;
  quotedText: string;
  isThreadReply: boolean;
}

export function splitEmailBody(raw?: string): ParsedEmailBody {
  if (!raw) return { mainText: 'No message content.', quotedText: '', isThreadReply: false };

  // Common email client reply introduction lines:
  // e.g. "On Sun, Sep 6, 2026 at 2:45 AM Tushar Aradhye <...> wrote:"
  // or "On Sep 6, 2026, at 2:45 AM, ..."
  // or "-----Original Message-----"
  // or "________________________________"
  // or "From: ... Sent: ... To: ..."
  const patterns = [
    /\r?\n\s*(On\s+[\s\S]+?wrote:\s*[\r\n]+[\s\S]*)/i,
    /\r?\n\s*(-{3,}\s*Original Message\s*-{3,}[\s\S]*)/i,
    /\r?\n\s*(_{10,}[\s\S]*)/,
    /\r?\n\s*(From:\s*.+?\r?\n(?:Sent|Date):\s*.+?[\s\S]*)/i
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match && match.index !== undefined) {
      const mainText = raw.substring(0, match.index).trim();
      const quotedText = match[1].trim();
      return { 
        mainText: mainText || '(Empty reply message)', 
        quotedText, 
        isThreadReply: true 
      };
    }
  }

  // Also check if text begins with blockquotes >
  const lines = raw.split(/\r?\n/);
  const firstQuoteIdx = lines.findIndex(l => l.trim().startsWith('>'));
  if (firstQuoteIdx > 0) {
    const mainText = lines.slice(0, firstQuoteIdx).join('\n').trim();
    const quotedText = lines.slice(firstQuoteIdx).join('\n').trim();
    return { 
      mainText: mainText || '(Empty reply message)', 
      quotedText, 
      isThreadReply: true 
    };
  } else if (firstQuoteIdx === 0) {
    return {
      mainText: '(Quoted message)',
      quotedText: raw.trim(),
      isThreadReply: true
    };
  }

  return { mainText: raw.trim(), quotedText: '', isThreadReply: false };
}
