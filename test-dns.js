import dns from 'dns';
dns.resolveMx('bot.devtushar.uk', (err, addresses) => {
  if (err) console.error('bot.devtushar.uk:', err.message);
  else console.log('bot.devtushar.uk:', addresses);
});
dns.resolveMx('devtushar.uk', (err, addresses) => {
  if (err) console.error('devtushar.uk:', err.message);
  else console.log('devtushar.uk:', addresses);
});
