const CF_API_TOKEN = 'tOs9zzjjMJJlOWZt5gtcIon1f5wRMMjxC04ryBH2';
const CF_ZONE_ID = 'ece18603c8c28e1cbfa19222167df87f';

async function test() {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/email/routing/rules`, {
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
