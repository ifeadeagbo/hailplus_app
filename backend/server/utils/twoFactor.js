// Two-factor sign-in with authenticator apps (TOTP, RFC 6238)
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { authenticator } = require('otplib');
const { encrypt, decrypt } = require('./secretBox');

authenticator.options = { window: 1 }; // accept the previous/next 30s code for clock drift

const ISSUER = process.env.STORE_NAME || 'Hailplus';
const PENDING_COOKIE = 'twofa';
const RECOVERY_CODE_COUNT = 8;

const hashCode = (code) => crypto.createHash('sha256').update(code.replace(/[\s-]/g, '').toLowerCase()).digest('hex');

// A new secret and the QR code the user scans
const createSetup = async (user) => {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(user.email, ISSUER, secret);
  return {
    encryptedSecret: encrypt(secret),
    secret,
    qrCode: await QRCode.toDataURL(otpauthUrl)
  };
};

const generateRecoveryCodes = () =>
  Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const raw = crypto.randomBytes(5).toString('hex');
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });

// Checks an authenticator code, rejecting reuse of an already-accepted one.
// Returns the time step to store, or null when the code is wrong or reused.
const checkAuthenticatorCode = (user, code) => {
  if (!/^\d{6}$/.test(code || '') || !user.twoFactorSecret) return null;
  const delta = authenticator.checkDelta(code, decrypt(user.twoFactorSecret));
  if (delta === null) return null;
  const step = Math.floor(Date.now() / 30000) + delta;
  if (user.twoFactorLastStep && step <= Number(user.twoFactorLastStep)) return null;
  return step;
};

// Accepts an authenticator code or an unused recovery code, and records its
// use. Returns true when the code was valid.
const verifyAndConsume = async (user, code) => {
  const input = String(code || '').trim();
  const step = checkAuthenticatorCode(user, input);
  if (step !== null) {
    await user.update({ twoFactorLastStep: step });
    return true;
  }

  const codes = user.twoFactorRecoveryCodes || [];
  const index = codes.indexOf(hashCode(input));
  if (index === -1) return false;
  await user.update({ twoFactorRecoveryCodes: codes.filter((_, i) => i !== index) });
  return true;
};

// Short-lived cookie proving the password step passed; only good for /2fa/verify
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth'
});

const issuePendingCookie = (res, user) => {
  const token = jwt.sign({ id: user.id, tv: user.tokenVersion, purpose: '2fa' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  res.cookie(PENDING_COOKIE, token, { ...cookieOptions(), maxAge: 5 * 60 * 1000 });
};

const readPendingCookie = (req) => {
  try {
    const decoded = jwt.verify(req.cookies?.[PENDING_COOKIE] || '', process.env.JWT_SECRET);
    return decoded.purpose === '2fa' ? decoded : null;
  } catch (error) {
    return null;
  }
};

const clearPendingCookie = (res) => res.clearCookie(PENDING_COOKIE, cookieOptions());

module.exports = {
  createSetup,
  generateRecoveryCodes,
  hashCode,
  checkAuthenticatorCode,
  verifyAndConsume,
  issuePendingCookie,
  readPendingCookie,
  clearPendingCookie
};
