// Checks a password against Have I Been Pwned's list of passwords leaked in
// data breaches, using k-anonymity: only the first 5 characters of the
// password's SHA-1 hash are sent, never the password.
// https://haveibeenpwned.com/API/v3#PwnedPasswords
const crypto = require('crypto');
const logger = require('./logger');

// Returns how many times the password appears in known breaches (0 = none)
const timesBreached = async (password) => {
  const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    // Padding hides how many real matches the prefix has
    headers: { 'Add-Padding': 'true', 'User-Agent': 'hailplus-store' },
    signal: AbortSignal.timeout(3000)
  });
  if (!response.ok) {
    throw new Error(`Pwned Passwords responded ${response.status}`);
  }

  for (const line of (await response.text()).split('\n')) {
    const [candidate, count] = line.trim().split(':');
    if (candidate === suffix) return parseInt(count, 10);
  }
  return 0;
};

// Fails open: if the service is unreachable, sign-up and password changes
// still work. Off in tests unless a test opts in (test passwords are common).
const isBreached = async (password) => {
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_PWNED_CHECK) return false;
  try {
    return (await timesBreached(password)) > 0;
  } catch (error) {
    logger.warn('Breached-password check skipped', { reason: error.message });
    return false;
  }
};

module.exports = { isBreached, timesBreached };
