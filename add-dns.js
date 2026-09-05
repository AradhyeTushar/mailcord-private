const CF_API_TOKEN = 'tOs9zzjjMJJlOWZt5gtcIon1f5wRMMjxC04ryBH2';
const CF_ZONE_ID = 'ece18603c8c28e1cbfa19222167df87f';

async function addRecord(type, name, content, priority) {
  const payload = { type, name, content, ttl: 1 };
  if (priority !== undefined) payload.priority = priority;

  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (data.success) {
    console.log(`✅ Added ${type} record for ${name} -> ${content}`);
  } else {
    // If it already exists, Cloudflare returns error 81057
    if (data.errors.some(e => e.code === 81057)) {
      console.log(`ℹ️ ${type} record for ${name} -> ${content} already exists.`);
    } else {
      console.error(`❌ Failed to add ${type} record:`, data.errors);
    }
  }
}

async function main() {
  console.log("Adding DNS records for bot.devtushar.uk...");
  await addRecord('MX', 'bot', 'route1.mx.cloudflare.net', 1);
  await addRecord('MX', 'bot', 'route2.mx.cloudflare.net', 2);
  await addRecord('MX', 'bot', 'route3.mx.cloudflare.net', 3);
  await addRecord('TXT', 'bot', 'v=spf1 include:_spf.mx.cloudflare.net ~all');
  console.log("Done!");
}

main();
