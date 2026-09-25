jest.mock('../config/stripe', () => require('./helpers/stripeMock'));
jest.mock('../utils/emailService');

const { User } = require('../models');
const { client, resetDb, createUser, loginAs, closeAll, request, app } = require('./helpers/app');

beforeEach(resetDb);
afterAll(closeAll);

describe('registration', () => {
  test('sets an httpOnly auth cookie and never returns the token', async () => {
    const c = client();
    const res = await c.post('/api/auth/register', { email: 'New@Example.com', password: 'goodpass123', name: 'New User' });

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('token');
    expect(res.body.user.email).toBe('new@example.com');
    const cookie = res.headers['set-cookie'].find(c => c.startsWith('token='));
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
  });

  test('rejects weak passwords with a readable message', async () => {
    const res = await client().post('/api/auth/register', { email: 'weak@example.com', password: 'short1', name: 'Weak' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 8 characters/);
  });

  test('rejects duplicate emails', async () => {
    const user = await createUser();
    const res = await client().post('/api/auth/register', { email: user.email, password: 'goodpass123', name: 'Dup' });
    expect(res.status).toBe(400);
  });
});

describe('login and sessions', () => {
  test('cookie authenticates and profile hides sensitive fields', async () => {
    const user = await createUser();
    const c = await loginAs(user);
    const res = await c.get('/api/auth/profile');

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
    for (const field of ['password', 'tokenVersion', 'resetPasswordToken', 'googleId', 'stripeCustomerId']) {
      expect(res.body).not.toHaveProperty(field);
    }
  });

  test('wrong password and unknown email get the same answer', async () => {
    const user = await createUser();
    const wrong = await client().post('/api/auth/login', { email: user.email, password: 'wrongpass1' });
    const unknown = await client().post('/api/auth/login', { email: 'nobody@example.com', password: 'wrongpass1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error).toBe(unknown.body.error);
  });

  test('social-login accounts are told to use their provider', async () => {
    const user = await createUser({ password: null, provider: 'google', googleId: 'g-123' });
    const res = await client().post('/api/auth/login', { email: user.email, password: 'whatever123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/google/);
  });

  test('logout clears the cookie', async () => {
    const c = await loginAs(await createUser());
    await c.post('/api/auth/logout');
    expect((await c.get('/api/auth/profile')).status).toBe(401);
  });

  test('changing password signs out other devices but keeps this one', async () => {
    const user = await createUser();
    const laptop = await loginAs(user);
    const phone = await loginAs(user);

    const res = await laptop.put('/api/users/change-password', { currentPassword: 'password123', newPassword: 'newpass456' });
    expect(res.status).toBe(200);
    expect((await laptop.get('/api/auth/profile')).status).toBe(200);
    expect((await phone.get('/api/auth/profile')).status).toBe(401);
  });

  test('deactivated users are signed out and cannot log in', async () => {
    const user = await createUser();
    const c = await loginAs(user);
    await user.update({ active: false });

    expect((await c.get('/api/auth/profile')).status).toBe(401);
    expect((await client().post('/api/auth/login', { email: user.email, password: 'password123' })).status).toBe(401);
  });
});

describe('profile updates', () => {
  test('can change name but not email', async () => {
    const user = await createUser();
    const c = await loginAs(user);
    const res = await c.put('/api/auth/profile', { name: 'Renamed', email: 'evil@example.com' });

    expect(res.status).toBe(200);
    await user.reload();
    expect(user.name).toBe('Renamed');
    expect(user.email).not.toBe('evil@example.com');
  });
});

describe('CSRF protection', () => {
  test('writes without X-Requested-With are rejected', async () => {
    const c = await loginAs(await createUser());
    const res = await c.agent.put('/api/auth/profile').send({ name: 'Attacker' });
    expect(res.status).toBe(403);
  });

  test('reads do not need the header', async () => {
    const c = await loginAs(await createUser());
    expect((await c.agent.get('/api/auth/profile')).status).toBe(200);
  });
});

describe('social login', () => {
  test('providers without real keys are disabled', async () => {
    const res = await client().get('/api/auth/providers');
    expect(res.body.providers).toEqual([]);
  });

  test('disabled provider redirects back to login with a reason', async () => {
    const res = await request(app).get('/api/auth/google');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('http://localhost:3000/login?error=provider_unavailable');
  });
});

describe('rate limiting', () => {
  test('repeated failed logins are blocked with a JSON error', async () => {
    const attempt = () => request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-Test-Rate-Limit', 'on')
      .send({ email: 'nobody@example.com', password: 'wrongpass1' });

    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await attempt()).status);

    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Too many/);
  });
});

describe('password reset', () => {
  const crypto = require('crypto');

  const issueResetToken = async (user) => {
    const token = crypto.randomBytes(32).toString('hex');
    await user.update({
      resetPasswordToken: crypto.createHash('sha256').update(token).digest('hex'),
      resetPasswordExpires: new Date(Date.now() + 3600000)
    });
    return token;
  };

  test('request does not reveal whether the account exists', async () => {
    const user = await createUser();
    const known = await client().post('/api/public/password-reset', { email: user.email });
    const unknown = await client().post('/api/public/password-reset', { email: 'nobody@example.com' });
    expect(known.status).toBe(200);
    expect(known.body).toEqual(unknown.body);
  });

  test('reset sets the password, signs out sessions and burns the token', async () => {
    const user = await createUser();
    const existingSession = await loginAs(user);
    const token = await issueResetToken(user);

    const res = await client().post(`/api/public/password-reset/${token}`, { password: 'resetpass789' });
    expect(res.status).toBe(200);
    expect((await existingSession.get('/api/auth/profile')).status).toBe(401);
    await loginAs(user, 'resetpass789');

    await user.reload();
    expect(user.resetPasswordToken).toBeNull();
  });

  test('expired tokens are rejected', async () => {
    const user = await createUser();
    const token = await issueResetToken(user);
    await user.update({ resetPasswordExpires: new Date(Date.now() - 1000) });

    const res = await client().post(`/api/public/password-reset/${token}`, { password: 'resetpass789' });
    expect(res.status).toBe(400);
  });

  test('malformed tokens are rejected before hitting the database', async () => {
    const res = await client().post('/api/public/password-reset/not-a-token', { password: 'resetpass789' });
    expect(res.status).toBe(400);
  });
});

test('User model hashes passwords', async () => {
  const user = await createUser({ password: 'plaintext123' });
  const stored = await User.findByPk(user.id);
  expect(stored.password).not.toBe('plaintext123');
  expect(stored.password).toMatch(/^\$2[aby]\$/);
});
