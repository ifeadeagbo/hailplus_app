jest.mock('../config/stripe', () => require('./helpers/stripeMock'));
jest.mock('../utils/emailService');

const { User } = require('../models');
const { client, resetDb, resetRateLimits, createUser, loginAs, closeAll, request, app } = require('./helpers/app');

beforeEach(async () => {
  await resetDb();
  resetRateLimits();
});
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

describe('deleting an account', () => {
  const { Order } = require('../models');

  test('erases personal details, signs out, blocks sign-in, keeps order records', async () => {
    const user = await createUser({ name: 'Ada Buyer' });
    const order = await Order.create({
      userId: user.id, items: [], totalAmount: '10.00', status: 'delivered', paymentMethod: 'card',
      shippingAddress: {}, billingAddress: {}
    });
    const c = await loginAs(user);

    const res = await c.agent.delete('/api/auth/account').set('X-Requested-With', 'XMLHttpRequest').send({ password: 'password123' });
    expect(res.status).toBe(200);

    await user.reload();
    expect(user).toMatchObject({ name: 'Deleted customer', active: false, password: null });
    expect(user.email).toBe(`deleted-${user.id}@deleted.invalid`);
    expect((await c.get('/api/auth/profile')).status).toBe(401);
    expect(await Order.findByPk(order.id)).not.toBeNull();
    // The original email can sign up again
    const again = await client().post('/api/auth/register', { email: 'ada-new@example.com', password: 'goodpass123', name: 'Ada' });
    expect(again.status).toBe(201);
  });

  test('needs the correct password', async () => {
    const c = await loginAs(await createUser());
    const res = await c.agent.delete('/api/auth/account').set('X-Requested-With', 'XMLHttpRequest').send({ password: 'wrongpass1' });
    expect(res.status).toBe(401);
  });

  test('social sign-in accounts confirm by typing DELETE', async () => {
    const user = await createUser({ password: null, provider: 'google', googleId: 'g-del' });
    const { issueAuthCookie } = require('../utils/authCookie');
    let cookie;
    issueAuthCookie({ cookie: (name, value) => { cookie = `${name}=${value}`; } }, user);
    const del = (body) => request(app).delete('/api/auth/account').set('Cookie', cookie).set('X-Requested-With', 'XMLHttpRequest').send(body);

    expect((await del({ confirm: 'yes' })).status).toBe(400);
    expect((await del({ confirm: 'DELETE' })).status).toBe(200);
  });

  test('blocked while an order is in progress', async () => {
    const user = await createUser();
    await Order.create({
      userId: user.id, items: [], totalAmount: '10.00', status: 'shipped', paymentMethod: 'card',
      shippingAddress: {}, billingAddress: {}
    });
    const c = await loginAs(user);
    const res = await c.agent.delete('/api/auth/account').set('X-Requested-With', 'XMLHttpRequest').send({ password: 'password123' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/orders in progress/);
  });

  test('the only admin cannot delete their account', async () => {
    const c = await loginAs(await createUser({ role: 'admin' }));
    const res = await c.agent.delete('/api/auth/account').set('X-Requested-With', 'XMLHttpRequest').send({ password: 'password123' });
    expect(res.status).toBe(409);
  });
});

describe('breached passwords', () => {
  const crypto = require('crypto');
  const sha1 = (text) => crypto.createHash('sha1').update(text).digest('hex').toUpperCase();

  beforeEach(() => { process.env.TEST_PWNED_CHECK = '1'; });
  afterEach(() => {
    delete process.env.TEST_PWNED_CHECK;
    jest.restoreAllMocks();
  });

  // Simulates the Pwned Passwords range API: only the given passwords are "breached"
  const mockPwned = (...breached) => jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
    const prefix = url.split('/').pop();
    const lines = breached.map(sha1).filter(h => h.startsWith(prefix)).map(h => `${h.slice(5)}:1234`);
    return { ok: true, text: async () => ['0000000000000000000000000000000000A:0', ...lines].join('\r\n') };
  });

  test('sign-up rejects a password found in a breach, sending only a hash prefix', async () => {
    const fetchMock = mockPwned('leaked123pass');
    const res = await client().post('/api/auth/register', { email: 'b1@example.com', password: 'leaked123pass', name: 'Breach Test' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/data breach/);
    const url = fetchMock.mock.calls[0][0];
    expect(url).toBe(`https://api.pwnedpasswords.com/range/${sha1('leaked123pass').slice(0, 5)}`);
    expect(url).not.toContain('leaked123pass');
  });

  test('a password not in any breach is accepted', async () => {
    mockPwned('some-other-leak1');
    const res = await client().post('/api/auth/register', { email: 'b2@example.com', password: 'unique-pass-9x', name: 'Breach Test' });
    expect(res.status).toBe(201);
  });

  test('if the breach service is down, sign-up still works', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    const res = await client().post('/api/auth/register', { email: 'b3@example.com', password: 'unique-pass-9x', name: 'Breach Test' });
    expect(res.status).toBe(201);
  });

  test('changing to a breached password is rejected', async () => {
    const c = await loginAs(await createUser());
    mockPwned('leaked123pass');
    const res = await c.put('/api/users/change-password', { currentPassword: 'password123', newPassword: 'leaked123pass' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/data breach/);
  });
});

describe('sign-up limit', () => {
  test('an IP can create 10 accounts an hour, then is blocked', async () => {
    const signUp = (i) => request(app)
      .post('/api/auth/register')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('X-Test-Rate-Limit', 'on')
      .send({ email: `bulk-${i}@example.com`, password: 'goodpass123', name: 'Bulk User' });

    for (let i = 0; i < 10; i++) {
      expect((await signUp(i)).status).toBe(201);
    }
    const blocked = await signUp(10);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Too many accounts/);
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
