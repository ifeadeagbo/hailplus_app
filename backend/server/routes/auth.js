const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter, signupLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin, validateProfile } = require('../utils/validators');
const { enabledProviders } = require('../config/passport');

// Local auth routes
router.post('/register', signupLimiter, authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/logout', authController.logout);

// Profile routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validateProfile, authController.updateProfile);
router.delete('/account', authLimiter, authenticate, authController.deleteAccount);

// Two-factor sign-in (authenticator app)
router.post('/2fa/verify', authLimiter, authController.verifyTwoFactor);
router.post('/2fa/setup', authenticate, authController.setupTwoFactor);
router.post('/2fa/enable', authLimiter, authenticate, authController.enableTwoFactor);
router.post('/2fa/disable', authLimiter, authenticate, authController.disableTwoFactor);

// Which social login buttons the frontend should show
router.get('/providers', (req, res) => {
  res.json({ providers: enabledProviders });
});

// Social login. The session only holds the OAuth "state" value during the
// redirect; the logged-in user is carried by the auth cookie.
const socialLogin = (provider, scope) => {
  const loginFailed = (reason) => `${process.env.CLIENT_URL}/login?error=${reason}`;

  router.get(`/${provider}`, (req, res, next) => {
    if (!enabledProviders.includes(provider)) {
      return res.redirect(loginFailed('provider_unavailable'));
    }
    passport.authenticate(provider, { scope, session: false })(req, res, next);
  });

  router.get(`/${provider}/callback`, (req, res, next) => {
    if (!enabledProviders.includes(provider)) {
      return res.redirect(loginFailed('provider_unavailable'));
    }
    passport.authenticate(provider, { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.redirect(loginFailed(info?.message || 'oauth_failed'));
      }
      req.user = user;
      authController.oauthSuccess(req, res);
    })(req, res, next);
  });
};

socialLogin('google', ['profile', 'email']);
socialLogin('facebook', ['email']);

module.exports = router;
