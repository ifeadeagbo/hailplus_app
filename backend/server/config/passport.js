const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const { User } = require('../models');

// Placeholder values from the .env template count as "not configured"
const isConfigured = (...values) =>
  values.every(value => value && !value.startsWith('your_'));

const callbackURL = (provider) =>
  `${process.env.SERVER_URL || ''}/api/auth/${provider}/callback`;

// Finds the user for a social profile, linking or creating an account.
// An existing email/password account is only linked when the provider
// has verified the email, otherwise anyone could claim that account.
const findOrCreateSocialUser = async ({ provider, idField, profileId, email, emailVerified, name }) => {
  let user = await User.findOne({ where: { [idField]: profileId } });

  if (!user) {
    if (!email) {
      return { error: 'no_email' };
    }

    user = await User.findOne({ where: { email } });
    if (user) {
      if (!emailVerified) {
        return { error: 'email_in_use' };
      }
      user[idField] = profileId;
      user.emailVerified = true;
      await user.save();
    } else {
      user = await User.create({
        [idField]: profileId,
        email,
        name,
        provider,
        emailVerified: emailVerified
      });
    }
  }

  if (!user.active) {
    return { error: 'account_disabled' };
  }
  return { user };
};

const verify = (buildArgs) => async (accessToken, refreshToken, profile, done) => {
  try {
    const { user, error } = await findOrCreateSocialUser(buildArgs(profile));
    done(null, user || false, error && { message: error });
  } catch (error) {
    done(error);
  }
};

const enabledProviders = [];

if (isConfigured(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL('google'),
    state: true
  }, verify(profile => ({
    provider: 'google',
    idField: 'googleId',
    profileId: profile.id,
    email: profile.emails?.[0]?.value?.toLowerCase(),
    emailVerified: profile._json?.email_verified === true,
    name: profile.displayName
  }))));
  enabledProviders.push('google');
}

if (isConfigured(process.env.FACEBOOK_APP_ID, process.env.FACEBOOK_APP_SECRET)) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: callbackURL('facebook'),
    profileFields: ['id', 'emails', 'name'],
    state: true
  }, verify(profile => ({
    provider: 'facebook',
    idField: 'facebookId',
    profileId: profile.id,
    email: profile.emails?.[0]?.value?.toLowerCase(),
    // Facebook only returns emails the user has confirmed
    emailVerified: Boolean(profile.emails?.[0]?.value),
    name: [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') || 'Facebook user'
  }))));
  enabledProviders.push('facebook');
}

module.exports = { enabledProviders };
