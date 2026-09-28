const jwt = require('jsonwebtoken');

const AUTH_COOKIE = 'token';

const cookieOptions = () => ({
  httpOnly: true, // not readable by page scripts, so XSS can't steal it
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
});

// tokenVersion is bumped on password change/reset, which invalidates
// every token issued before it
const issueAuthCookie = (res, user) => {
  const token = jwt.sign(
    { id: user.id, tv: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  const { exp } = jwt.decode(token);
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), expires: new Date(exp * 1000) });
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
};

// Fields that are safe to send to the browser
const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  provider: user.provider,
  emailVerified: user.emailVerified,
  twoFactorEnabled: user.twoFactorEnabled,
  createdAt: user.createdAt
});

module.exports = {
  AUTH_COOKIE,
  issueAuthCookie,
  clearAuthCookie,
  publicUser
};
