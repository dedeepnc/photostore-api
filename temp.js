// bring in the crypto module
const crypto = require('node:crypto');  

// Use generateKey method
// Specify 'hmac' algorithm and key length
crypto.generateKey('hmac', { length: 512 }, (err, key) => {
  if (err) throw err;
  // Export the key to JWK format
  console.log(key.export().toString('hex'));
});
