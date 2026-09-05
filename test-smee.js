async function testSmee() {
  const res = await fetch('https://smee.io/mailcord-devtushar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'test@bot.devtushar.uk',
      from: 'test@example.com',
      headers: { subject: 'Test from script' },
      raw: 'This is a test email raw body'
    })
  });
  console.log('Smee POST status:', res.status);
}
testSmee();
