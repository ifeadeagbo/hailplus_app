// Encrypts small secrets at rest (AES-256-GCM). The key comes from
// TWO_FACTOR_KEY, or is derived from JWT_SECRET when that isn't set
// (changing whichever is used makes stored 2FA secrets unreadable; users
// can then still sign in with a recovery code and set 2FA up again).
const crypto = require('crypto');

const key = () =>
  crypto.createHash('sha256')
    .update(process.env.TWO_FACTOR_KEY || `${process.env.JWT_SECRET}:two-factor`)
    .digest();

const encrypt = (plaintext) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString('base64')).join('.');
};

const decrypt = (payload) => {
  const [iv, tag, encrypted] = payload.split('.').map(part => Buffer.from(part, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};

module.exports = { encrypt, decrypt };
